"""stripe removal from user

Revision ID: c5ed9d82f2fb
Revises: 5da175d5d5cc
Create Date: 2025-08-23 18:54:54.514904

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'c5ed9d82f2fb'
down_revision = '5da175d5d5cc'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('stripe_subscription_id')
        batch_op.drop_column('stripe_customer_id')

def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stripe_customer_id', sa.VARCHAR(length=120), nullable=True))
        batch_op.add_column(sa.Column('stripe_subscription_id', sa.VARCHAR(length=120), nullable=True))
