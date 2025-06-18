-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create Projects table
create table projects (
    id uuid default uuid_generate_v4() primary key,
    h2s_no text unique not null,
    project_name text not null,
    architect_name text,
    total_fees decimal(12,2) not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create Fees table
create table fees (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid not null references projects(id) on delete cascade,
    particular text not null,
    amount decimal(12,2) not null default 0,
    created_at timestamptz default now()
);

-- Create Billing table
create table billing (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid not null references projects(id) on delete cascade,
    percentage decimal(5,2) not null,
    amount decimal(12,2) not null,
    invoice_no text,
    invoice_date date,
    created_at timestamptz default now()
);

-- Create Receipts table
create table receipts (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid not null references projects(id) on delete cascade,
    check_no text,
    payment_date date not null,
    payment_method text not null check (payment_method in ('Check', 'Bank Transfer', 'Cash')),
    amount decimal(12,2) not null,
    created_at timestamptz default now()
);

-- Add updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Add triggers for updated_at
create trigger update_projects_updated_at
    before update on projects
    for each row
    execute procedure update_updated_at_column();

-- Add indexes
create index idx_projects_h2s_no on projects(h2s_no);
create index idx_fees_project_id on fees(project_id);
create index idx_billing_project_id on billing(project_id);
create index idx_receipts_project_id on receipts(project_id);
