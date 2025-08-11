"""Add is_admin and is_premium to User model

Revision ID: 3a5b6c7d8e9f
Revises: 211b3916030e
Create Date: 2025-08-10 22:51:30.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a5b6c7d8e9f'
down_revision = '211b3916030e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('is_premium', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('is_admin')
        batch_op.drop_column('is_premium')
