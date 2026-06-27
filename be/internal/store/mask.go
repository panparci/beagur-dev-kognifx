package store

import "strings"

func maskBankAccount(value string) string {
	if value == "" {
		return value
	}
	digitCount := 0
	for _, r := range value {
		if r >= '0' && r <= '9' {
			digitCount++
		}
	}
	if digitCount <= 3 {
		return value
	}
	seen := 0
	var b strings.Builder
	for _, r := range value {
		if r >= '0' && r <= '9' {
			seen++
			if seen <= digitCount-3 {
				b.WriteRune('x')
				continue
			}
		}
		b.WriteRune(r)
	}
	return b.String()
}

func maskTeacherForPublic(t TeacherProfile) TeacherProfile {
	t.BankAccountNumber = maskBankAccount(t.BankAccountNumber)
	t.PhoneNumber = ""
	t.BankName = ""
	return t
}
