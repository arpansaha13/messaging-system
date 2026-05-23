package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/arpansaha13/goauthkit"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/app"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/arpansaha13/messaging-system/apps/common/testdeps"
	"github.com/stretchr/testify/suite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type AuthTestSuite struct {
	suite.Suite
	DepSet         *testdeps.ResolvedDependencySet
	DB             *gorm.DB
	Ctx            context.Context
	HTTPServerAddr string
	HTTPServer     *http.Server
	HTTPClient     *HTTPTestHelper
	Deps           *app.Dependencies
	Fixture        *TestFixture
}

// TestFixture represents a common test fixture for all test cases
type TestFixture struct {
	T          *testing.T
	Ctx        context.Context
	DB         *gorm.DB
	HTTPClient *HTTPTestHelper
	Deps       *app.Dependencies
}

func NewTestFixture(t *testing.T, db *gorm.DB, httpServerAddr string, deps *app.Dependencies) *TestFixture {
	return &TestFixture{
		T:          t,
		Ctx:        context.Background(),
		DB:         db,
		HTTPClient: NewHTTPTestHelper(httpServerAddr),
		Deps:       deps,
	}
}

// TableDrivenTestCase represents a single test case in a table-driven test
type TableDrivenTestCase struct {
	Name        string
	Setup       func(*TestFixture) error // Setup creates test data
	Test        func(*TestFixture) error // Test executes the test logic
	Verify      func(*TestFixture) error // Verify checks the results
	ExpectError bool                     // ExpectError indicates if an error is expected
	ErrMsg      string                   // ErrMsg is the expected error message (optional)
}

func (s *AuthTestSuite) SetupSuite() {
	os.Setenv("ENVIRONMENT", constants.EnvTest.String())
	os.Setenv("SECRET_KEY", "test-secret-key-for-testing-purposes-only")
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-testing-purposes-only")
	os.Setenv("HTTP_PORT", "0")
	os.Setenv("AUTH_COOKIE_NAME", "auth_session")

	ctx := context.Background()
	s.Ctx = ctx

	resolvedDeps, err := testdeps.ResolveTestDependencies(ctx, testdeps.PostgresConfig{
		ServiceName: "auth",
		DBUser:      "testuser",
		DBPassword:  "testpass",
		DBName:      "test_auth",
	})
	s.Require().NoError(err)
	s.DepSet = resolvedDeps
	databaseURL := resolvedDeps.Deps.PostgresURL
	os.Setenv("DATABASE_URL", databaseURL)

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	s.Require().NoError(err)
	s.DB = db

	// Run migrations
	err = goauthkit.AutoMigrate(db)
	s.Require().NoError(err)

	// Initialize deps and server
	logger, _ := zap.NewDevelopment()
	cbs := circuits.New(logger)
	appDeps := app.SetupDependencies(db, logger, cbs, nil)
	s.Deps = appDeps
	s.HTTPServer = app.SetupHTTPServer(appDeps, logger)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	s.Require().NoError(err)
	s.HTTPServerAddr = "http://" + listener.Addr().String()
	s.HTTPClient = NewHTTPTestHelper(s.HTTPServerAddr)
	s.Fixture = NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.Deps)

	go func() {
		if err := s.HTTPServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()
	time.Sleep(100 * time.Millisecond)
}

func (s *AuthTestSuite) TearDownSuite() {
	if s.HTTPServer != nil {
		s.HTTPServer.Shutdown(s.Ctx)
	}
	if s.DepSet != nil {
		s.Require().NoError(s.DepSet.Teardown(s.Ctx))
	}
}

func (s *AuthTestSuite) SetupTest() {
	tables := []string{"users", "credentials", "otps", "sessions"}
	for _, table := range tables {
		s.DB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
	}
	s.Fixture = NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.Deps)
}

// HTTPTestHelper provides HTTP client functionality for tests
type HTTPTestHelper struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewHTTPTestHelper(baseURL string) *HTTPTestHelper {
	return &HTTPTestHelper{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

func (h *HTTPTestHelper) MakeRequest(method, path string, body any, cookie *http.Cookie) (*http.Response, error) {
	url := h.BaseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		req.AddCookie(cookie)
	}

	return h.HTTPClient.Do(req)
}

func (h *HTTPTestHelper) POST(path string, body any) (*http.Response, error) {
	return h.MakeRequest("POST", path, body, nil)
}

func (h *HTTPTestHelper) POSTWithCookie(path string, body any, cookie *http.Cookie) (*http.Response, error) {
	return h.MakeRequest("POST", path, body, cookie)
}
