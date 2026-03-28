package handler

import "strconv"

// parseUserID converts a string user ID to int64
func parseUserID(userID string) int64 {
	id, _ := strconv.ParseInt(userID, 10, 64)
	return id
}

// parseGroupID converts a string group ID to int64
func parseGroupID(groupID string) int64 {
	id, _ := strconv.ParseInt(groupID, 10, 64)
	return id
}
