package store

import (
	"context"
	"time"
)

type MonthlyAnalyticsPoint struct {
	Month              string `json:"month"`
	Label              string `json:"label"`
	DonationAmount     int64  `json:"donationAmount"`
	DonationCount      int64  `json:"donationCount"`
	DonorCount         int64  `json:"donorCount"`
	TransferAmount     int64  `json:"transferAmount"`
	TeachersCumulative int64  `json:"teachersCumulative"`
	CumulativeDonation int64  `json:"cumulativeDonation"`
	CumulativeTransfer int64  `json:"cumulativeTransfer"`
	Source             string `json:"source"`
}

type AnalyticsSummary struct {
	TotalDonation       int64 `json:"totalDonation"`
	TotalDonors         int64 `json:"totalDonors"`
	AvgDonationPerMonth int64 `json:"avgDonationPerMonth"`
	TotalTransfer       int64 `json:"totalTransfer"`
	Undisbursed         int64 `json:"undisbursed"`
	TeachersStart       int64 `json:"teachersStart"`
	TeachersEnd         int64 `json:"teachersEnd"`
	TeacherGrowthPct    int   `json:"teacherGrowthPct"`
	TotalDonationCount  int64 `json:"totalDonationCount"`
}

type ProgramAnalytics struct {
	PeriodFrom string                  `json:"periodFrom"`
	PeriodTo   string                  `json:"periodTo"`
	Months     []MonthlyAnalyticsPoint `json:"months"`
	Summary    AnalyticsSummary        `json:"summary"`
}

type AnalyticsSnapshotInput struct {
	Month              string `json:"month"`
	DonationAmount     *int64 `json:"donationAmount,omitempty"`
	DonationCount      *int   `json:"donationCount,omitempty"`
	DonorCount         *int   `json:"donorCount,omitempty"`
	TransferAmount     *int64 `json:"transferAmount,omitempty"`
	TeachersCumulative *int   `json:"teachersCumulative,omitempty"`
	Source             string `json:"source"`
	Note               string `json:"note"`
}

type analyticsSnapshotRow struct {
	Month              time.Time
	DonationAmount     *int64
	DonationCount      *int32
	DonorCount         *int32
	TransferAmount     *int64
	TeachersCumulative *int32
	Source             string
}

func startOfMonth(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.UTC)
}

func monthLabelID(t time.Time) string {
	labels := [...]string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"}
	m := int(t.Month()) - 1
	if t.Year() != time.Now().UTC().Year() {
		return labels[m] + " " + t.Format("06")
	}
	return labels[m]
}

func (s *Store) MonthlyProgramAnalytics(ctx context.Context, monthCount int) (ProgramAnalytics, error) {
	if err := s.requireDB(); err != nil {
		return ProgramAnalytics{}, err
	}
	if monthCount < 1 || monthCount > 36 {
		monthCount = 12
	}
	now := time.Now().UTC()
	periodTo := startOfMonth(now)
	periodFrom := periodTo.AddDate(0, -(monthCount - 1), 0)
	periodEnd := periodTo.AddDate(0, 1, 0)

	rows, err := s.pool.Query(ctx, `
		WITH month_series AS (
			SELECT generate_series($1::date, $2::date, '1 month'::interval)::date AS month_start
		),
		donations_by_month AS (
			SELECT date_trunc('month', created_at AT TIME ZONE 'UTC')::date AS m,
			       COALESCE(SUM(amount), 0)::bigint AS amt,
			       COUNT(*)::bigint AS cnt,
			       COUNT(DISTINCT donor_user_id)::bigint AS donors
			FROM donations
			WHERE verification_status = 'VERIFIED'
			  AND created_at >= $1
			  AND created_at < $3
			GROUP BY 1
		),
		transfers_by_month AS (
			SELECT date_trunc('month', occurred_at AT TIME ZONE 'UTC')::date AS m,
			       COALESCE(SUM(amount), 0)::bigint AS amt
			FROM ledger_entries
			WHERE entry_type = 'OUT'
			  AND occurred_at >= $1
			  AND occurred_at < $3
			GROUP BY 1
		)
		SELECT ms.month_start,
		       COALESCE(d.amt, 0),
		       COALESCE(d.cnt, 0),
		       COALESCE(d.donors, 0),
		       COALESCE(t.amt, 0),
		       (
		         SELECT COUNT(*)::bigint FROM teacher_profiles tp
		         WHERE tp.status = 'APPROVED'
		           AND tp.updated_at < ms.month_start + interval '1 month'
		       )
		FROM month_series ms
		LEFT JOIN donations_by_month d ON d.m = ms.month_start
		LEFT JOIN transfers_by_month t ON t.m = ms.month_start
		ORDER BY ms.month_start`,
		periodFrom, periodTo, periodEnd)
	if err != nil {
		return ProgramAnalytics{}, err
	}
	defer rows.Close()

	points := make([]MonthlyAnalyticsPoint, 0, monthCount)
	for rows.Next() {
		var monthStart time.Time
		var p MonthlyAnalyticsPoint
		if err := rows.Scan(
			&monthStart,
			&p.DonationAmount,
			&p.DonationCount,
			&p.DonorCount,
			&p.TransferAmount,
			&p.TeachersCumulative,
		); err != nil {
			return ProgramAnalytics{}, err
		}
		p.Month = monthStart.Format("2006-01-02")
		p.Label = monthLabelID(monthStart)
		p.Source = "computed"
		points = append(points, p)
	}
	if err := rows.Err(); err != nil {
		return ProgramAnalytics{}, err
	}

	snapshots, err := s.loadAnalyticsSnapshots(ctx, periodFrom, periodEnd)
	if err != nil {
		return ProgramAnalytics{}, err
	}
	for i := range points {
		snap, ok := snapshots[points[i].Month]
		if !ok {
			continue
		}
		points[i].Source = snap.Source
		if snap.DonationAmount != nil {
			points[i].DonationAmount = *snap.DonationAmount
		}
		if snap.DonationCount != nil {
			points[i].DonationCount = int64(*snap.DonationCount)
		}
		if snap.DonorCount != nil {
			points[i].DonorCount = int64(*snap.DonorCount)
		}
		if snap.TransferAmount != nil {
			points[i].TransferAmount = *snap.TransferAmount
		}
		if snap.TeachersCumulative != nil {
			points[i].TeachersCumulative = int64(*snap.TeachersCumulative)
		}
	}

	var cumDon, cumXfer int64
	for i := range points {
		cumDon += points[i].DonationAmount
		cumXfer += points[i].TransferAmount
		points[i].CumulativeDonation = cumDon
		points[i].CumulativeTransfer = cumXfer
	}

	summary := AnalyticsSummary{}
	if len(points) > 0 {
		for _, p := range points {
			summary.TotalDonation += p.DonationAmount
			summary.TotalTransfer += p.TransferAmount
			summary.TotalDonationCount += p.DonationCount
		}
		summary.TeachersStart = points[0].TeachersCumulative
		summary.TeachersEnd = points[len(points)-1].TeachersCumulative
		summary.AvgDonationPerMonth = summary.TotalDonation / int64(len(points))
		if summary.TeachersStart > 0 {
			summary.TeacherGrowthPct = int((summary.TeachersEnd - summary.TeachersStart) * 100 / summary.TeachersStart)
		}
	}
	summary.Undisbursed = summary.TotalDonation - summary.TotalTransfer
	if summary.Undisbursed < 0 {
		summary.Undisbursed = 0
	}

	// Distinct donors across period (live DB, not snapshot)
	_ = s.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT donor_user_id)
		FROM donations
		WHERE verification_status = 'VERIFIED'
		  AND created_at >= $1 AND created_at < $2`,
		periodFrom, periodEnd).Scan(&summary.TotalDonors)

	return ProgramAnalytics{
		PeriodFrom: periodFrom.Format("2006-01-02"),
		PeriodTo:   periodTo.Format("2006-01-02"),
		Months:     points,
		Summary:    summary,
	}, nil
}

func (s *Store) loadAnalyticsSnapshots(ctx context.Context, from, end time.Time) (map[string]analyticsSnapshotRow, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT month, donation_amount, donation_count, donor_count,
		       transfer_amount, teachers_cumulative, source
		FROM analytics_monthly_snapshots
		WHERE month >= $1 AND month < $2`,
		from, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]analyticsSnapshotRow)
	for rows.Next() {
		var row analyticsSnapshotRow
		if err := rows.Scan(
			&row.Month,
			&row.DonationAmount,
			&row.DonationCount,
			&row.DonorCount,
			&row.TransferAmount,
			&row.TeachersCumulative,
			&row.Source,
		); err != nil {
			return nil, err
		}
		out[row.Month.Format("2006-01-02")] = row
	}
	return out, rows.Err()
}

func (s *Store) UpsertAnalyticsSnapshots(ctx context.Context, rows []AnalyticsSnapshotInput) (int, error) {
	if err := s.requireDB(); err != nil {
		return 0, err
	}
	if len(rows) == 0 || len(rows) > 120 {
		return 0, ErrInvalidState
	}
	n := 0
	for _, row := range rows {
		month, err := time.Parse("2006-01-02", row.Month)
		if err != nil {
			return n, ErrInvalidState
		}
		month = startOfMonth(month.UTC())
		source := row.Source
		if source == "" {
			source = "import"
		}
		tag, err := s.pool.Exec(ctx, `
			INSERT INTO analytics_monthly_snapshots (
				month, donation_amount, donation_count, donor_count,
				transfer_amount, teachers_cumulative, source, note
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (month) DO UPDATE SET
				donation_amount = COALESCE(EXCLUDED.donation_amount, analytics_monthly_snapshots.donation_amount),
				donation_count = COALESCE(EXCLUDED.donation_count, analytics_monthly_snapshots.donation_count),
				donor_count = COALESCE(EXCLUDED.donor_count, analytics_monthly_snapshots.donor_count),
				transfer_amount = COALESCE(EXCLUDED.transfer_amount, analytics_monthly_snapshots.transfer_amount),
				teachers_cumulative = COALESCE(EXCLUDED.teachers_cumulative, analytics_monthly_snapshots.teachers_cumulative),
				source = EXCLUDED.source,
				note = COALESCE(NULLIF(EXCLUDED.note, ''), analytics_monthly_snapshots.note),
				updated_at = NOW()`,
			month,
			row.DonationAmount,
			row.DonationCount,
			row.DonorCount,
			row.TransferAmount,
			row.TeachersCumulative,
			source,
			row.Note,
		)
		if err != nil {
			return n, err
		}
		n += int(tag.RowsAffected())
	}
	return n, nil
}
