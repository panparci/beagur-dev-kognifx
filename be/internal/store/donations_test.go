package store

import (
	"strings"
	"testing"
)

func TestValidateDonationAmount(t *testing.T) {
	if err := validateDonationAmount(1); err != nil {
		t.Fatalf("expected ok for 1, got %v", err)
	}
	if err := validateDonationAmount(0); err == nil {
		t.Fatal("expected error for 0")
	}
	if err := validateDonationAmount(-100); err == nil {
		t.Fatal("expected error for negative")
	}
	if err := validateDonationAmount(maxDonationAmount + 1); err == nil {
		t.Fatal("expected error above max")
	}
}

func TestNormalizeDonationType(t *testing.T) {
	got, err := normalizeDonationType("recurring")
	if err != nil || got != "RECURRING" {
		t.Fatalf("got %q err %v", got, err)
	}
	if _, err := normalizeDonationType("WEEKLY"); err == nil {
		t.Fatal("expected error for unknown type")
	}
}

func TestRequireDonorProofURL(t *testing.T) {
	if err := requireDonorProofURL(""); err == nil {
		t.Fatal("empty proof should fail")
	}
	if err := requireDonorProofURL("/api/v1/files/proofs/x.jpg"); err != nil {
		t.Fatalf("stored proof path should pass: %v", err)
	}
	if err := requireDonorProofURL("ftp://bad"); err == nil {
		t.Fatal("invalid scheme should fail")
	}
}

func TestGenerateInvoiceNumberUnique(t *testing.T) {
	a := generateInvoiceNumber(500_000)
	b := generateInvoiceNumber(500_000)
	if a == b {
		t.Fatalf("expected unique invoice numbers, got duplicate %q", a)
	}
	if !strings.HasPrefix(a, "BG-") {
		t.Fatalf("unexpected prefix: %q", a)
	}
}
