package authjwt

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type Validator struct {
	jwksURL string
	issuer  string
	audience string

	mu       sync.RWMutex
	keySet   jwk.Set
	fetchedAt time.Time
	ttl      time.Duration
}

type Claims struct {
	Subject string
	Email   string
	Name    string
}

func NewValidator(jwksURL, issuer, audience string) *Validator {
	return &Validator{
		jwksURL:  jwksURL,
		issuer:   issuer,
		audience: audience,
		ttl:      10 * time.Minute,
	}
}

func (v *Validator) Validate(ctx context.Context, tokenString string) (Claims, error) {
	tokenString = strings.TrimSpace(tokenString)
	if tokenString == "" {
		return Claims{}, fmt.Errorf("empty token")
	}

	keySet, err := v.keySetFor(ctx)
	if err != nil {
		return Claims{}, err
	}

	token, err := jwt.Parse(
		[]byte(tokenString),
		jwt.WithKeySet(keySet),
		jwt.WithValidate(true),
		jwt.WithIssuer(v.issuer),
		jwt.WithAudience(v.audience),
	)
	if err != nil {
		return Claims{}, err
	}

	claims := Claims{}
	if sub, ok := token.Subject(); ok {
		claims.Subject = sub
	}
	var email string
	if err := token.Get("email", &email); err == nil {
		claims.Email = email
	}
	var name string
	if err := token.Get("name", &name); err == nil {
		claims.Name = name
	}
	if claims.Email == "" {
		return Claims{}, fmt.Errorf("token missing email claim")
	}
	return claims, nil
}

func (v *Validator) keySetFor(ctx context.Context) (jwk.Set, error) {
	v.mu.RLock()
	if v.keySet != nil && time.Since(v.fetchedAt) < v.ttl {
		defer v.mu.RUnlock()
		return v.keySet, nil
	}
	v.mu.RUnlock()

	v.mu.Lock()
	defer v.mu.Unlock()
	if v.keySet != nil && time.Since(v.fetchedAt) < v.ttl {
		return v.keySet, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks fetch failed: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	set, err := jwk.Parse(body)
	if err != nil {
		return nil, err
	}
	v.keySet = set
	v.fetchedAt = time.Now()
	return v.keySet, nil
}
