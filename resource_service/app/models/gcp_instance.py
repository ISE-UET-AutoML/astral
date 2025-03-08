from .instance import Instance


class GcpInstance(Instance):
    type: str = "google_compute_instance"
    resource_name: str = "gce_1"
    machine_type: str = "e2-micro"
    image: str = "debian-cloud/debian-11"
    tag_name: str = "gce-1"
    zone: str = "us-central1-a"

    def get_terraform_config(self):
        content = f"""resource "{self.type}" "{self.resource_name}" {{
  name         = "{self.tag_name}"
  machine_type = "{self.machine_type}"
  zone         = "{self.zone}"

  boot_disk {{
    initialize_params {{
      image = "{self.image}"  # Hình ảnh hệ điều hành, có thể thay đổi tùy theo yêu cầu
    }}
  }}

  network_interface {{
    network = "default"  # Sử dụng mạng mặc định của GCP
    access_config {{
      # Cung cấp IP công cộng cho instance
    }}
  }}
}}"""

        return content

    @staticmethod
    def get_instance_info(resource: dict) -> dict:
        instances = resource["instances"]
        instance_attr = instances[0]["attributes"]
        public_ip = instance_attr["network_interface"][0]["access_config"][0]["nat_ip"]
        return {
            "type": resource["type"],
            "name": resource["name"],
            "availability_zone": instance_attr["zone"],
            "id": instance_attr["instance_id"],
            "instance_type": instance_attr["machine_type"],
            "instance_state": instance_attr["current_status"],
            # "key_name": instance_attr["key_name"],
            "public_dns": public_ip,
            # "private_ip": instance_attr["private_ip"],
            "public_ip": public_ip,
        }
