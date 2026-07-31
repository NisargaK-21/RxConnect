"use client";

export default function StaffTable({
  staff,
  onEdit,
  onDelete,
}) {
  return (
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Branch</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {staff.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.branch_id}</td>

            <td>
              <button
                onClick={() => onEdit(user)}
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(user.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}