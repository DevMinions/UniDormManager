package utils

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOrderByRejectsInjection(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM students")
	qb.OrderBy("status", "ASC; DROP TABLE students--")
	assert.Contains(t, qb.baseQuery, "ORDER BY status DESC")
	assert.NotContains(t, qb.baseQuery, "DROP")
}

func TestOrderByValidOrdersPreserved(t *testing.T) {
	qbAsc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbAsc.OrderBy("name", "asc")
	assert.Contains(t, qbAsc.baseQuery, "ORDER BY name ASC")

	qbDesc := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qbDesc.OrderBy("name", "DESC")
	assert.Contains(t, qbDesc.baseQuery, "ORDER BY name DESC")
}

func TestOrderByNonWhitelistedColumnIgnored(t *testing.T) {
	qb := NewQueryBuilder(context.Background(), "SELECT * FROM x")
	qb.OrderBy("evil_col", "ASC")
	assert.NotContains(t, qb.baseQuery, "ORDER BY")
}
