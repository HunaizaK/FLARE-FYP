from pydantic import BaseModel


class DonationAccountCreate(BaseModel):
    account_title: str
    account_no: str
    bank_name: str
    iban: str
