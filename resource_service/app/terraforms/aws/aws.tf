provider "aws" {
  region = "${var.region}"
  access_key = "${var.access_key}"
  secret_key = "${var.secret_key}"
  # alias  = "us_east"
}

resource "aws_key_pair" "example" {
  key_name   = "my-key-pair"
  public_key = file("~/.ssh/id_rsa.pub")  # Đặt public key của bạn vào đây
}

resource "aws_security_group" "allow_ssh" {
  name        = "allow_ssh"
  description = "Allow SSH inbound traffic"
  # vpc_id      = "vpc-xxxxxxxx"  # VPC ID của bạn, nếu cần

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Cho phép SSH từ mọi địa chỉ IP (hoặc có thể thay bằng một dải IP cụ thể)
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # Cho phép ra ngoài
  }
}
