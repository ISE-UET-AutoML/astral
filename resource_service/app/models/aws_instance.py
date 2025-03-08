from .instance import Instance


class AwsInstance(Instance):
    type: str = "aws_instance"
    resource_name: str = "ec2_01"
    ami: str = "ami-053a45fff0a704a47"
    instance_type: str = "t2.micro"
    tag_name: str = "ec2_01"

    def get_terraform_config(self) -> str:
        content = f"""resource "{self.type}" "{self.resource_name}" {{
    ami           = "{self.ami}"
    instance_type = "{self.instance_type}"
    tags = {{
    Name = "{self.tag_name}"
    }}
    key_name      = aws_key_pair.example.key_name  # Tên khóa SSH bạn đã tạo
    security_groups = [aws_security_group.allow_ssh.name]  # Sử dụng Security Group cho phép SSH

}}"""
        return content

    @staticmethod
    def get_instance_info(resource: dict) -> dict:
        instances = resource["instances"]
        instance_attr = instances[0]["attributes"]
        return {
            "type": "aws_instance",
            "name": resource["name"],
            "tag_name": instance_attr["tags"]["Name"],
            "availability_zone": instance_attr["availability_zone"],
            "id": instance_attr["id"],
            "instance_type": instance_attr["instance_type"],
            "instance_state": instance_attr["instance_state"],
            "key_name": instance_attr["key_name"],
            "public_dns": instance_attr["public_dns"],
            "private_ip": instance_attr["private_ip"],
            "public_ip": instance_attr["public_ip"],
        }
