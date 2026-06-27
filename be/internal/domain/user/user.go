package user

type Role string

const (
	RoleAdmin     Role = "ADMIN"
	RoleTeacher   Role = "TEACHER"
	RoleDonor     Role = "DONOR"
	RoleValidator Role = "VALIDATOR"
)

type AccountStatus string

const (
	AccountStatusNoRole              AccountStatus = "NO_ROLE"
	AccountStatusPendingVerification AccountStatus = "PENDING_VERIFICATION"
	AccountStatusActive              AccountStatus = "ACTIVE"
)

type CurrentUser struct {
	ID            string        `json:"id"`
	Email         string        `json:"email"`
	Name          string        `json:"name"`
	Role          Role          `json:"role,omitempty"`
	Roles         []Role        `json:"roles"`
	Permissions   []string      `json:"permissions"`
	AccountStatus AccountStatus `json:"accountStatus"`
}
