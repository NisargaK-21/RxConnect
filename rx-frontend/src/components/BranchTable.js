export default function BranchTable({
  branches,
  onEdit,
  onDelete,
}) {
  return (
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Address</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>

      <tbody>
        {branches.map((branch) => (
          <tr key={branch.id}>
            <td>{branch.id}</td>
            <td>{branch.name}</td>
            <td>{branch.address}</td>

            <td>
              <button
                onClick={() => onEdit(branch)}
              >
                Edit
              </button>
            </td>

            <td>
              <button
                onClick={() => onDelete(branch.id)}
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