import { prisma } from '@/lib/db';
import { StaffManager, type StaffRow } from '@/components/admin/StaffManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff · Admin' };

const STAFF_ROLES = ['support_staff', 'admin', 'super_admin', 'builder'] as const;

export default async function AdminStaffPage() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: [...STAFF_ROLES] },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      userId: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      mfaEnabled: true,
      lastLoginAt: true,
      deletedAt: true,
      createdAt: true,
      webauthnCredentials: { select: { credentialId: true } },
    },
  });

  const staff: StaffRow[] = users.map((u) => {
    // Invited users: have no lastLoginAt and no verified email yet
    const status: StaffRow['status'] = u.deletedAt
      ? 'suspended'
      : !u.lastLoginAt
        ? 'invited'
        : 'active';
    return {
      userId: u.userId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      mfaEnabled: u.mfaEnabled,
      lastActiveAt: u.lastLoginAt?.toISOString() ?? null,
      status,
      passkeys: u.webauthnCredentials.length,
      lastLoginIp: null,
    };
  });

  const stats = {
    active: staff.filter((s) => s.status === 'active').length,
    suspended: staff.filter((s) => s.status === 'suspended').length,
    pending: staff.filter((s) => s.status === 'invited').length,
  };

  return <StaffManager staff={staff} stats={stats} />;
}
