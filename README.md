Okay, I have reviewed the `README.md` content. The problem in the previous `replace` call was due to the exact matching requirement for `old_string`. My `old_string` was too long and specific, and the content of `README.md` was slightly different.

This time, I will make the `old_string` shorter and target the exact line where the "Invitation Module" heading starts.

The "Invitation Module" heading is:
```
## Invitation Module
```

I will insert the new "Security & Abuse Prevention" section directly before this line.

The content of the new section will be:

```markdown
## Security & Abuse Prevention

The invitation system incorporates several measures to ensure security and prevent abuse:

*   **Single-Use Invitation Tokens**: Each invitation token is designed for a single registration. Once an invitation is successfully accepted and a user account is created, the invitation's status is changed to `ACCEPTED`, rendering the token invalid for subsequent use.
*   **Unique Email Registration**: The system prevents multiple user registrations with the same email address. If an attempt is made to register with an email that already belongs to an existing user, the registration will be rejected.
*   **Prevention of Concurrent Invitations**: To avoid confusion and potential abuse, only one active (pending and not expired) invitation can exist for a given email address at any time. Attempts to create multiple active invitations for the same email will be blocked.
*   **Login Restrictions**: All user accounts are subject to strict login restrictions to ensure account integrity. Users cannot log in if their email address is not verified or if their account is inactive. Refer to the [Login Restrictions](#login-restrictions) section for more details.
*   **Automatic Cleanup of Expired Invitations**: A scheduled task runs daily to automatically identify and mark pending invitations that have passed their `expiresAt` timestamp as `EXPIRED`. This prevents the accumulation of stale and potentially exploitable invitation tokens.
*   **Audit Logging**: The system logs details about invitation creation, including who invited whom and when. This audit trail helps in tracking and investigating any suspicious activity.
```

Let's try this `replace` call again with a more precise `old_string`.