package notify

// RenderAccountCreatedHTML exposes the signup template for dev/test sends.
func RenderAccountCreatedHTML(name, portalURL string) string {
	return accountCreatedHTML(name, portalURL)
}
