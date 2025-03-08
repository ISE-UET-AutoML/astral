from dataclasses import dataclass
from fastapi import HTTPException
from label_studio_sdk.label_interface import LabelInterface
from label_studio_sdk.label_interface.create import choices

from models.label_studio import LabelConfigRequest


@dataclass
class LabelConfig:
    TABULAR_CLASSIFICATION = """<View>
        <Header value="Tabular test"/>
        <Table name="table" value="$item"/>
        <Choices name="choice" toName="table">
            <Choice value="0"/>
            <Choice value="1"/>
        </Choices>
    </View>"""
    IMAGE_CLASSIFICATION = """<View>
        <Image name="image" value="$image"/>
        <Choices name="choice" toName="image">
            <Choice value="0"/>
            <Choice value="1"/>
        </Choices>
    </View>"""
    TEXT_CLASSIFICATION = """<View>
        <Text name="text" value="$text"/>
        <Choices name="choice" toName="text">
            <Choice value="0"/>
            <Choice value="1"/>
        </Choices>
    </View>"""

    @classmethod
    def get_label_config(
        self, project_type: str, label_config_args: LabelConfigRequest
    ):
        config = {}
        config["temp-col-for-any-data"] = "Text"
        if project_type.__contains__("CLASSIFICATION"):
            if (
                label_config_args.label_choices is None
                or len(label_config_args.label_choices) == 0
            ):
              
                raise HTTPException(
                    status_code=400, detail="Label choices must be provided"
                )
            config["label"] = choices(label_config_args.label_choices)
        else:
            raise HTTPException(
                status_code=400, detail=f'Project type "{project_type}" not supported'
            )
        # if project_type.__contains__("TABULAR"):
        #     config["table"] = "Table"
        # if project_type.__contains__("IMAGE"):
        #     config["image"] = "Image"
        # if project_type.__contains__("TEXT"):
        #     config["text"] = "Text"

        label_config = LabelInterface.create(config)

        print("LABEL_CONFIG : ", label_config)
        
        return label_config
