# Định nghĩa provider cho Google Cloud
provider "google" {
  credentials = "${var.credentials}"                      # Đường dẫn tới file service account key
  project     = "${var.project}"                    # ID của GCP project
  region      = "us-central1"                             # Khu vực (region) của GCP
}
