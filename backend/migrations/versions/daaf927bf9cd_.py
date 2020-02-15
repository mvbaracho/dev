"""empty message

Revision ID: daaf927bf9cd
Revises: fa784acff2bb
Create Date: 2020-02-15 16:21:11.398513

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'daaf927bf9cd'
down_revision = 'fa784acff2bb'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('lms', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    op.alter_column('lms', 'name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('lms', 'updated_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('lms', 'updated_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    op.alter_column('lms', 'name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('lms', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True)
    # ### end Alembic commands ###