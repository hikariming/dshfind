package cache

import (
	"testing"
	"time"

	"github.com/dsh-external/dshfind/server/internal/store"
)

func TestDatasetMetadataIsContentStableAndUsesLatestSourceTime(t *testing.T) {
	lastSynced := "2026-08-16T10:00:00Z"
	scoredAt := "2026-08-17T12:00:00Z"
	plugins := []store.Plugin{{
		FullName: "owner/plugin", LastSyncedAt: &lastSynced, ScoredAt: &scoredAt,
	}}
	firstVersion, asOf := datasetMetadata(plugins, time.Date(2026, 8, 18, 0, 0, 0, 0, time.UTC))
	secondVersion, _ := datasetMetadata(plugins, time.Date(2026, 8, 19, 0, 0, 0, 0, time.UTC))
	if firstVersion == "" || firstVersion != secondVersion {
		t.Errorf("versions = %q / %q, want a stable non-empty content version", firstVersion, secondVersion)
	}
	if got := asOf.Format(time.RFC3339); got != scoredAt {
		t.Errorf("asOf = %s, want latest source time %s", got, scoredAt)
	}

	changed := append([]store.Plugin(nil), plugins...)
	changed[0].Stars = 1
	changedVersion, _ := datasetMetadata(changed, time.Time{})
	if changedVersion == firstVersion {
		t.Error("data version did not change after public plugin data changed")
	}
}
