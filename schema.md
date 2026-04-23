{
  "id": "29c9b3f0-cf26-47ce-b16d-2f42aef85e77",
  "prevId": "e65fae34-77ca-495b-8de2-63315828e89b",
  "version": "7",
  "dialect": "postgresql",
  "tables": {
    "public.account": {
      "name": "account",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "account_id": {
          "name": "account_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "provider_id": {
          "name": "provider_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "access_token": {
          "name": "access_token",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "refresh_token": {
          "name": "refresh_token",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "id_token": {
          "name": "id_token",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "access_token_expires_at": {
          "name": "access_token_expires_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "refresh_token_expires_at": {
          "name": "refresh_token_expires_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "scope": {
          "name": "scope",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "password": {
          "name": "password",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        }
      },
      "indexes": {},
      "foreignKeys": {
        "account_user_id_users_id_fk": {
          "name": "account_user_id_users_id_fk",
          "tableFrom": "account",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.branches": {
      "name": "branches",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "company_id": {
          "name": "company_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "address": {
          "name": "address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "timezone": {
          "name": "timezone",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'America/Mexico_City'"
        },
        "operating_hours": {
          "name": "operating_hours",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "location": {
          "name": "location",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "invite_token": {
          "name": "invite_token",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false,
          "default": "gen_random_uuid()"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "branches_company_id_companies_id_fk": {
          "name": "branches_company_id_companies_id_fk",
          "tableFrom": "branches",
          "tableTo": "companies",
          "columnsFrom": [
            "company_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "branches_invite_token_unique": {
          "name": "branches_invite_token_unique",
          "nullsNotDistinct": false,
          "columns": [
            "invite_token"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.break_logs": {
      "name": "break_logs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "session_id": {
          "name": "session_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "start_time": {
          "name": "start_time",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "end_time": {
          "name": "end_time",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "duration_minutes": {
          "name": "duration_minutes",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'STANDARD'"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "break_logs_session_id_shift_sessions_id_fk": {
          "name": "break_logs_session_id_shift_sessions_id_fk",
          "tableFrom": "break_logs",
          "tableTo": "shift_sessions",
          "columnsFrom": [
            "session_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.companies": {
      "name": "companies",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "tax_id": {
          "name": "tax_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "plan": {
          "name": "plan",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'FREE'"
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.executions": {
      "name": "executions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "session_id": {
          "name": "session_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "template_id": {
          "name": "template_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "assignee_id": {
          "name": "assignee_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'PENDING'"
        },
        "current_step_index": {
          "name": "current_step_index",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 0
        },
        "total_steps": {
          "name": "total_steps",
          "type": "integer",
          "primaryKey": false,
          "notNull": true
        },
        "data": {
          "name": "data",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false,
          "default": "'{}'::jsonb"
        },
        "score": {
          "name": "score",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "started_at": {
          "name": "started_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "completed_at": {
          "name": "completed_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "executions_session_id_shift_sessions_id_fk": {
          "name": "executions_session_id_shift_sessions_id_fk",
          "tableFrom": "executions",
          "tableTo": "shift_sessions",
          "columnsFrom": [
            "session_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "executions_template_id_workflow_templates_id_fk": {
          "name": "executions_template_id_workflow_templates_id_fk",
          "tableFrom": "executions",
          "tableTo": "workflow_templates",
          "columnsFrom": [
            "template_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "executions_branch_id_branches_id_fk": {
          "name": "executions_branch_id_branches_id_fk",
          "tableFrom": "executions",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "executions_assignee_id_users_id_fk": {
          "name": "executions_assignee_id_users_id_fk",
          "tableFrom": "executions",
          "tableTo": "users",
          "columnsFrom": [
            "assignee_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.holidays": {
      "name": "holidays",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "company_id": {
          "name": "company_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "date": {
          "name": "date",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "affects_operation": {
          "name": "affects_operation",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "holidays_company_id_companies_id_fk": {
          "name": "holidays_company_id_companies_id_fk",
          "tableFrom": "holidays",
          "tableTo": "companies",
          "columnsFrom": [
            "company_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.incidents": {
      "name": "incidents",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "execution_id": {
          "name": "execution_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "step_id": {
          "name": "step_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "severity": {
          "name": "severity",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'DETECTED'"
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "initial_value": {
          "name": "initial_value",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "target_value": {
          "name": "target_value",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "photo_url": {
          "name": "photo_url",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "remediation_protocol": {
          "name": "remediation_protocol",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "current_attempt": {
          "name": "current_attempt",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 0
        },
        "max_attempts": {
          "name": "max_attempts",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 1
        },
        "resolved_at": {
          "name": "resolved_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "incidents_execution_id_executions_id_fk": {
          "name": "incidents_execution_id_executions_id_fk",
          "tableFrom": "incidents",
          "tableTo": "executions",
          "columnsFrom": [
            "execution_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.magic_links": {
      "name": "magic_links",
      "schema": "",
      "columns": {
        "token": {
          "name": "token",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "session_id": {
          "name": "session_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "execution_id": {
          "name": "execution_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "workflow_template_id": {
          "name": "workflow_template_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'PENDING'"
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "used_at": {
          "name": "used_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "magic_links_session_id_shift_sessions_id_fk": {
          "name": "magic_links_session_id_shift_sessions_id_fk",
          "tableFrom": "magic_links",
          "tableTo": "shift_sessions",
          "columnsFrom": [
            "session_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "magic_links_execution_id_executions_id_fk": {
          "name": "magic_links_execution_id_executions_id_fk",
          "tableFrom": "magic_links",
          "tableTo": "executions",
          "columnsFrom": [
            "execution_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "magic_links_workflow_template_id_workflow_templates_id_fk": {
          "name": "magic_links_workflow_template_id_workflow_templates_id_fk",
          "tableFrom": "magic_links",
          "tableTo": "workflow_templates",
          "columnsFrom": [
            "workflow_template_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.schedule_configs": {
      "name": "schedule_configs",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "template_id": {
          "name": "template_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "cron_expression": {
          "name": "cron_expression",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "target_roles": {
          "name": "target_roles",
          "type": "text[]",
          "primaryKey": false,
          "notNull": true
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "schedule_configs_branch_id_branches_id_fk": {
          "name": "schedule_configs_branch_id_branches_id_fk",
          "tableFrom": "schedule_configs",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "schedule_configs_template_id_workflow_templates_id_fk": {
          "name": "schedule_configs_template_id_workflow_templates_id_fk",
          "tableFrom": "schedule_configs",
          "tableTo": "workflow_templates",
          "columnsFrom": [
            "template_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.session": {
      "name": "session",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "token": {
          "name": "token",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "ip_address": {
          "name": "ip_address",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "user_agent": {
          "name": "user_agent",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        }
      },
      "indexes": {},
      "foreignKeys": {
        "session_user_id_users_id_fk": {
          "name": "session_user_id_users_id_fk",
          "tableFrom": "session",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "session_token_unique": {
          "name": "session_token_unique",
          "nullsNotDistinct": false,
          "columns": [
            "token"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.shift_assignments": {
      "name": "shift_assignments",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "day_of_week": {
          "name": "day_of_week",
          "type": "integer",
          "primaryKey": false,
          "notNull": false
        },
        "specific_date": {
          "name": "specific_date",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "shift_name": {
          "name": "shift_name",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "start_time": {
          "name": "start_time",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "end_time": {
          "name": "end_time",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "shift_assignments_user_id_users_id_fk": {
          "name": "shift_assignments_user_id_users_id_fk",
          "tableFrom": "shift_assignments",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "shift_assignments_branch_id_branches_id_fk": {
          "name": "shift_assignments_branch_id_branches_id_fk",
          "tableFrom": "shift_assignments",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.shift_sessions": {
      "name": "shift_sessions",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "user_id": {
          "name": "user_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'ACTIVE'"
        },
        "started_at": {
          "name": "started_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "ended_at": {
          "name": "ended_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "total_break_minutes": {
          "name": "total_break_minutes",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 0
        },
        "total_work_minutes": {
          "name": "total_work_minutes",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 0
        },
        "overtime_minutes": {
          "name": "overtime_minutes",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 0
        },
        "compliance_flags": {
          "name": "compliance_flags",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": false
        },
        "notes": {
          "name": "notes",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {},
      "foreignKeys": {
        "shift_sessions_user_id_users_id_fk": {
          "name": "shift_sessions_user_id_users_id_fk",
          "tableFrom": "shift_sessions",
          "tableTo": "users",
          "columnsFrom": [
            "user_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "shift_sessions_branch_id_branches_id_fk": {
          "name": "shift_sessions_branch_id_branches_id_fk",
          "tableFrom": "shift_sessions",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.users": {
      "name": "users",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "name": {
          "name": "name",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "email": {
          "name": "email",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "email_verified": {
          "name": "email_verified",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false
        },
        "image": {
          "name": "image",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true,
          "default": "now()"
        },
        "company_id": {
          "name": "company_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "phone": {
          "name": "phone",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "role": {
          "name": "role",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "pin_code": {
          "name": "pin_code",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "status": {
          "name": "status",
          "type": "text",
          "primaryKey": false,
          "notNull": false,
          "default": "'ACTIVE'"
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        }
      },
      "indexes": {},
      "foreignKeys": {
        "users_company_id_companies_id_fk": {
          "name": "users_company_id_companies_id_fk",
          "tableFrom": "users",
          "tableTo": "companies",
          "columnsFrom": [
            "company_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "users_branch_id_branches_id_fk": {
          "name": "users_branch_id_branches_id_fk",
          "tableFrom": "users",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {
        "users_email_unique": {
          "name": "users_email_unique",
          "nullsNotDistinct": false,
          "columns": [
            "email"
          ]
        },
        "users_phone_unique": {
          "name": "users_phone_unique",
          "nullsNotDistinct": false,
          "columns": [
            "phone"
          ]
        }
      },
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.verification": {
      "name": "verification",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "identifier": {
          "name": "identifier",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "value": {
          "name": "value",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "expires_at": {
          "name": "expires_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": true
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        }
      },
      "indexes": {},
      "foreignKeys": {},
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.workflow_templates": {
      "name": "workflow_templates",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "text",
          "primaryKey": true,
          "notNull": true
        },
        "company_id": {
          "name": "company_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": false
        },
        "original_template_id": {
          "name": "original_template_id",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "json_schema": {
          "name": "json_schema",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true
        },
        "version": {
          "name": "version",
          "type": "integer",
          "primaryKey": false,
          "notNull": false,
          "default": 1
        },
        "active": {
          "name": "active",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        },
        "category": {
          "name": "category",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "title": {
          "name": "title",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "description": {
          "name": "description",
          "type": "text",
          "primaryKey": false,
          "notNull": false
        },
        "is_custom": {
          "name": "is_custom",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "workflow_templates_company_id_companies_id_fk": {
          "name": "workflow_templates_company_id_companies_id_fk",
          "tableFrom": "workflow_templates",
          "tableTo": "companies",
          "columnsFrom": [
            "company_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    },
    "public.workflow_triggers": {
      "name": "workflow_triggers",
      "schema": "",
      "columns": {
        "id": {
          "name": "id",
          "type": "uuid",
          "primaryKey": true,
          "notNull": true,
          "default": "gen_random_uuid()"
        },
        "branch_id": {
          "name": "branch_id",
          "type": "uuid",
          "primaryKey": false,
          "notNull": true
        },
        "template_id": {
          "name": "template_id",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "type": {
          "name": "type",
          "type": "text",
          "primaryKey": false,
          "notNull": true
        },
        "config": {
          "name": "config",
          "type": "jsonb",
          "primaryKey": false,
          "notNull": true
        },
        "target_roles": {
          "name": "target_roles",
          "type": "text[]",
          "primaryKey": false,
          "notNull": false
        },
        "enabled": {
          "name": "enabled",
          "type": "boolean",
          "primaryKey": false,
          "notNull": false,
          "default": true
        },
        "last_triggered_at": {
          "name": "last_triggered_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false
        },
        "created_at": {
          "name": "created_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        },
        "updated_at": {
          "name": "updated_at",
          "type": "timestamp",
          "primaryKey": false,
          "notNull": false,
          "default": "now()"
        }
      },
      "indexes": {},
      "foreignKeys": {
        "workflow_triggers_branch_id_branches_id_fk": {
          "name": "workflow_triggers_branch_id_branches_id_fk",
          "tableFrom": "workflow_triggers",
          "tableTo": "branches",
          "columnsFrom": [
            "branch_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        },
        "workflow_triggers_template_id_workflow_templates_id_fk": {
          "name": "workflow_triggers_template_id_workflow_templates_id_fk",
          "tableFrom": "workflow_triggers",
          "tableTo": "workflow_templates",
          "columnsFrom": [
            "template_id"
          ],
          "columnsTo": [
            "id"
          ],
          "onDelete": "no action",
          "onUpdate": "no action"
        }
      },
      "compositePrimaryKeys": {},
      "uniqueConstraints": {},
      "policies": {},
      "checkConstraints": {},
      "isRLSEnabled": false
    }
  },
  "enums": {},
  "schemas": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "views": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}