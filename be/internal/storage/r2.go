package storage

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	PublicBaseURL   string
}

func (c R2Config) Enabled() bool {
	return strings.TrimSpace(c.AccountID) != "" &&
		strings.TrimSpace(c.AccessKeyID) != "" &&
		strings.TrimSpace(c.SecretAccessKey) != "" &&
		strings.TrimSpace(c.Bucket) != "" &&
		strings.TrimSpace(c.PublicBaseURL) != ""
}

type r2Client struct {
	bucket string
	public string
	s3     *s3.Client
}

func NewR2Client(cfg R2Config) (*r2Client, error) {
	if !cfg.Enabled() {
		return nil, nil
	}
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	client := s3.New(s3.Options{
		Region: "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials: credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		),
	})
	return &r2Client{
		bucket: cfg.Bucket,
		public: strings.TrimRight(cfg.PublicBaseURL, "/"),
		s3:     client,
	}, nil
}

func (c *r2Client) putPublic(key string, data []byte, contentType string) (string, error) {
	key = strings.TrimPrefix(key, "/")
	_, err := c.s3.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", err
	}
	return c.public + "/" + key, nil
}
