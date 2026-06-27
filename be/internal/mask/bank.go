package mask

import "strings"

func BankAccount(raw string, canViewFull bool) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if canViewFull {
		return raw
	}
	if len(raw) <= 4 {
		return "****"
	}
	return "****" + raw[len(raw)-4:]
}

func PhoneNumber(raw string, canViewFull bool) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if canViewFull {
		return raw
	}
	if len(raw) <= 4 {
		return "****"
	}
	return "****" + raw[len(raw)-4:]
}
