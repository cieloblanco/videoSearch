provider "aws" {
  region  = var.region
}

resource "aws_s3_bucket" "my_bucket" {
  bucket = "source18"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "my_bucket" {
  bucket = "source18-resized"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}