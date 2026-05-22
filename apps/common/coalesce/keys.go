package coalesce

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// ValidateSessionKey creates a canonical key from a session token.
// It hashes the token first to avoid printing/logging raw tokens in key lists or metrics.
func ValidateSessionKey(token string) string {
	h := sha256.Sum256([]byte(token))
	return fmt.Sprintf("auth:validate:%s", hex.EncodeToString(h[:]))
}

// GetUserKey creates a canonical key for single user retrieval.
func GetUserKey(userID int64) string {
	return fmt.Sprintf("auth:get-user:%d", userID)
}

// GetUserProfilesKey creates a canonical key from a list of user IDs.
// It sorts the IDs to ensure that different orderings of the same ID set coalesce to the same key.
func GetUserProfilesKey(userIDs []int64) string {
	sorted := make([]int64, len(userIDs))
	copy(sorted, userIDs)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })

	var sb strings.Builder
	sb.WriteString("user-profiles:")
	for i, id := range sorted {
		if i > 0 {
			sb.WriteByte(',')
		}
		sb.WriteString(strconv.FormatInt(id, 10))
	}
	return sb.String()
}

// SearchUserProfilesKey creates a canonical key for user profiles search.
func SearchUserProfilesKey(query string, limit int32) string {
	return fmt.Sprintf("user-profiles:search:%d:%s", limit, query)
}
