package db

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RequiredTables must exist after all Goose migrations — readyz fails if any are missing.
var RequiredTables = []string{
	"users",
	"roles",
	"permissions",
	"role_permissions",
	"institutions",
	"teacher_profiles",
	"donations",
	"ledger_entries",
	"program_settings",
	"analytics_monthly_snapshots",
	"admin_audit_logs",
	"user",
	"session",
	"account",
}

func MissingTables(ctx context.Context, pool *pgxpool.Pool, tables []string) ([]string, error) {
	if pool == nil {
		return tables, fmt.Errorf("database is not configured")
	}

	rows, err := pool.Query(ctx, `
		SELECT c.relname
		FROM pg_class c
		JOIN pg_namespace n ON n.oid = c.relnamespace
		WHERE n.nspname = 'public'
		  AND c.relkind = 'r'
		  AND c.relname = ANY($1::text[])`, tables)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	found := make(map[string]struct{}, len(tables))
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		found[name] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	missing := make([]string, 0)
	for _, table := range tables {
		if _, ok := found[table]; !ok {
			missing = append(missing, table)
		}
	}
	return missing, nil
}

func SchemaReady(ctx context.Context, pool *pgxpool.Pool) error {
	missing, err := MissingTables(ctx, pool, RequiredTables)
	if err != nil {
		return err
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing tables: %s", strings.Join(missing, ", "))
	}
	return nil
}
