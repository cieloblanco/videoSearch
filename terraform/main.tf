provider "aws" {
  region  = var.region
}

resource "aws_s3_bucket" "my_bucket1" {
  bucket = "fjk2-bucket-gif"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "my_bucket2" {
  bucket = "fjk2-bucket-img"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "my_bucket3" {
  bucket = "fjk2-bucket-info"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "my_bucket4" {
  bucket = "fjk2-bucket-jsonvideo"
  force_destroy = true
  acl    = "private"

  versioning {
    enabled = true
  }
}