package handler

import (
	"context"

	"bea-guru-api/internal/store"
)

func logAdminAction(ctx context.Context, st *store.Store, actorID, action, entityType, entityID string, detail map[string]any) {
	if st == nil || actorID == "" {
		return
	}
	_ = st.LogAdminAction(ctx, actorID, action, entityType, entityID, detail)
}
