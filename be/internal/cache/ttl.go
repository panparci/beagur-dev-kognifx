package cache

import (
	"sync"
	"time"
)

// TTL provides a thread-safe single-value cache with expiration.
type TTL[T any] struct {
	mu      sync.RWMutex
	ttl     time.Duration
	value   T
	expires time.Time
	has     bool
}

func NewTTL[T any](ttl time.Duration) *TTL[T] {
	return &TTL[T]{ttl: ttl}
}

func (c *TTL[T]) Get(fetch func() (T, error)) (T, error) {
	var zero T

	c.mu.RLock()
	if c.has && time.Now().Before(c.expires) {
		v := c.value
		c.mu.RUnlock()
		return v, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.has && time.Now().Before(c.expires) {
		return c.value, nil
	}

	v, err := fetch()
	if err != nil {
		return zero, err
	}
	c.value = v
	c.expires = time.Now().Add(c.ttl)
	c.has = true
	return v, nil
}

func (c *TTL[T]) Invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.has = false
}
