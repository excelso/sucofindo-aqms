alter table t_employee
    add blood_type_id int null after village_id_2;

alter table t_employee
    add height double null after blood_type_id;

alter table t_employee
    add weight double null after height;

alter table t_employee
    add medical_history longtext null after weight;

alter table t_employee
    add allergic_info longtext null after medical_history;

create table t_ptkp_status
(
    id          int auto_increment,
    status_name varchar(100) null,
    remark      longtext     null,
    created_at  datetime     null,
    updated_at  datetime     null,
    constraint t_ptkp_status_pk
        primary key (id)
);

alter table t_employee
    add total_dependant int null after allergic_info;

alter table t_employee
    add ptkp_status_id int null after total_dependant;

alter table t_employee
    add constraint t_employee_t_ptkp_status_id_fk
        foreign key (ptkp_status_id) references t_ptkp_status (id)
            on update cascade on delete cascade;

alter table t_employee
    add spouse_name varchar(100) null after ptkp_status_id;

alter table t_employee
    add spouse_phone varchar(100) null after spouse_name;

alter table t_employee
    add child_name_1 varchar(100) null after spouse_phone_number;

alter table t_employee
    add child_birth_date_1 date null after child_name_1;

alter table t_employee
    add child_name_2 varchar(100) null after child_birth_date_1;

alter table t_employee
    add child_birth_date_2 date null after child_name_2;

alter table t_employee
    add child_name_3 varchar(100) null after child_birth_date_2;

alter table t_employee
    add child_birth_date_3 date null after child_name_3;

alter table t_employee
    add emergency_contact varchar(100) null after child_birth_date_3;

alter table t_employee
    add emergency_name varchar(100) null after emergency_contact;

alter table t_employee
    add emergency_relationship_status_id int null after emergency_name;

alter table t_employee
    add mothers_name varchar(100) null after emergency_relationship_status_id;

alter table t_employee
    add mothers_birth_date date null after mothers_name;

alter table t_employee
    add mothers_phone_number varchar(100) null after mothers_birth_date;

alter table t_employee
    add fathers_name varchar(100) null after mothers_phone_number;

alter table t_employee
    add fathers_birth_date date null after fathers_name;

alter table t_employee
    add fathers_phone_number varchar(100) null after fathers_birth_date;

create table t_emergency_relationship_status
(
    id                int auto_increment,
    relationship_name varchar(100) null,
    created_at        datetime     null,
    updated_at        datetime     null,
    constraint t_emergency_relationship_status_pk
        primary key (id)
);

alter table t_employee
    add constraint t_employee_t_emergency_relationship_status_id_fk
        foreign key (emergency_relationship_status_id) references t_emergency_relationship_status (id)
            on update cascade on delete cascade;

alter table t_employee_allowance
    change allowance_option tax_option int null comment '1 = Non Tax | 2 = Full Tax | 3 = Partial Tax';

alter table t_employee_commission
    change commission_option tax_option int null comment '1 = Non Tax | 2 = Full Tax | 3 = Partial Tax';

alter table t_employee_reimbursement
    change reimbursement_option tax_option int null comment '1 = Non Tax | 2 = Full Tax | 3 = Partial Tax';

rename table t_employee_statutory_deduction to t_employee_pay_cut;

alter table t_employee_pay_cut
    change deduction_period pay_cut_period date null;

alter table t_employee
    add npwp varchar(20) null after family_number;

alter table t_employee
    add bpjs_kes_number varchar(100) null after npwp;

alter table t_employee
    add bpjs_kes_effective_date date null after bpjs_kes_number;

alter table t_employee
    add bpjs_tk_number varchar(100) null after bpjs_kes_effective_date;

alter table t_employee
    add bpjs_tk_effective_date date null after bpjs_tk_number;

alter table t_employee
    add health_insurance_number varchar(100) null after bpjs_tk_effective_date;

alter table t_employee
    add health_insurance_effective_date date null after health_insurance_number;

CREATE TABLE t_bank
(
    id         int AUTO_INCREMENT
        PRIMARY KEY,
    bank_name  varchar(100) NULL,
    bank_code  varchar(10)  NULL,
    created_at datetime     NULL,
    updated_at datetime     NULL
);

alter table t_employee
    add bank_id int null after health_insurance_effective_date;

alter table t_employee
    add bank_account_name varchar(100) null after bank_id;

alter table t_employee
    add bank_account_number varchar(100) null after bank_account_name;

alter table t_employee
    add bank_branch varchar(100) null after bank_account_number;

alter table t_employee
    add constraint t_employee_t_bank_id_fk
        foreign key (bank_id) references t_bank (id)
            on update cascade on delete cascade;

create table t_employee_education
(
    id                 int auto_increment,
    user_id            int          null,
    education_level_id int          null,
    entry_year         int          null,
    graduation_year    int          null,
    school_name        varchar(100) null,
    created_at         datetime     null,
    updated_at         datetime     null,
    constraint t_employee_education_pk
        primary key (id),
    constraint t_employee_education_t_users_id_fk
        foreign key (user_id) references t_users (id)
            on update cascade on delete cascade
);

CREATE TABLE t_education
(
    id             int AUTO_INCREMENT
        PRIMARY KEY,
    education_name varchar(100) NULL,
    created_at     datetime     NULL,
    updated_at     datetime     NULL
);

alter table t_employee_education
    add constraint t_employee_education_t_education_id_fk
        foreign key (education_level_id) references t_education (id)
            on update cascade on delete cascade;


create table t_skill_categories
(
    id            int auto_increment,
    category_name varchar(100) null,
    created_at    datetime     null,
    updated_at    datetime     null,
    constraint t_skill_categories_pk
        primary key (id)
);

create table t_employee_skill
(
    id                int auto_increment,
    user_id           int null,
    skill_name        varchar(100) null,
    skill_category_id int          null,
    skill_level       int          null,
    created_at        datetime     null,
    updated_at        datetime     null,
    constraint t_employee_skill_pk
        primary key (id),
    constraint t_employee_skill_t_skill_categories_id_fk
        foreign key (skill_category_id) references t_skill_categories (id)
            on update cascade on delete cascade,
    constraint t_employee_skill_t_users_id_fk
        foreign key (user_id) references t_users (id)
            on update cascade on delete cascade
);

alter table t_employee
    add twitter_page longtext null after fathers_phone_number;

alter table t_employee
    add facebook_page longtext null after twitter_page;

alter table t_employee
    add linkedin_page longtext null after facebook_page;

alter table t_employee
    add instagram_page longtext null after linkedin_page;

alter table t_employee
    add hobbies longtext null after instagram_page;

alter table t_employee
    add shoes_size double null comment 'Based on EU size' after hobbies;

alter table t_employee
    add top_clothing_size varchar(10) null after shoes_size;

alter table t_employee
    add pants_size double null after top_clothing_size;

alter table t_users_role
    add role_menu longtext null after level;

create table t_menu
(
    id         int auto_increment,
    menu_name  varchar(100) null,
    route      varchar(100) null,
    parent_id  int          null,
    sorting    int          null,
    created_at datetime     null,
    updated_at datetime     null,
    constraint t_menu_pk
        primary key (id)
);

alter table t_menu
    add icon varchar(100) null comment 'Icon Pakai Font Awesome' after menu_name;

alter table t_menu
    add flag_active int null after sorting;


