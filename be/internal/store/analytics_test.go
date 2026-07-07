package store

import (
	"testing"
	"time"
)

func TestMonthLabelID(t *testing.T) {
	jul := time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC)
	if got := monthLabelID(jul); got != "Jul 25" && got != "Jul" {
		t.Fatalf("unexpected label for Jul 2025: %q", got)
	}
	aug := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	if got := monthLabelID(aug); got != "Agt" {
		t.Fatalf("expected Agt, got %q", got)
	}
}

func TestStartOfMonth(t *testing.T) {
	in := time.Date(2026, 3, 15, 12, 0, 0, 0, time.UTC)
	got := startOfMonth(in)
	if got.Day() != 1 || got.Month() != 3 {
		t.Fatalf("expected Mar 1, got %v", got)
	}
}
