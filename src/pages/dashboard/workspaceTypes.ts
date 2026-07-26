export interface DevPermissions {
    scan:       boolean;
    fix_and_pr: boolean;
    chat:       boolean;
}

export interface DevMembership {
    workspace_id:       string;
    admin_name:         string;
    admin_email:        string;
    status:             'active' | 'suspended';
    permissions:        DevPermissions;
    credits_allocated:  number;
    credits_used:       number;
    joined_at:          string;
}
