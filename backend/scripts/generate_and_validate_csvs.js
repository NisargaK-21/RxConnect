const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '../../data/csv');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function validateDatasets() {
  console.log('--- Validating CSV Datasets ---');
  const files = ['branches.csv', 'medicines.csv', 'branch_stock.csv', 'medicine_substitutions.csv'];
  
  files.forEach(file => {
    const fullPath = path.join(CSV_DIR, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing expected CSV file: ${file}`);
    }
  });

  const branchesData = parseCSV(path.join(CSV_DIR, 'branches.csv'));
  const medicinesData = parseCSV(path.join(CSV_DIR, 'medicines.csv'));
  const stockData = parseCSV(path.join(CSV_DIR, 'branch_stock.csv'));
  const subsData = parseCSV(path.join(CSV_DIR, 'medicine_substitutions.csv'));

  // Validate branches
  const branchIds = new Set();
  branchesData.rows.forEach((row, i) => {
    const [id, name, address] = row;
    if (!id || isNaN(parseInt(id, 10))) throw new Error(`Invalid branch id at row ${i + 1} in branches.csv`);
    if (!name) throw new Error(`Empty branch name at row ${i + 1} in branches.csv`);
    if (!address) throw new Error(`Empty branch address at row ${i + 1} in branches.csv`);
    branchIds.add(parseInt(id, 10));
  });

  // Validate medicines
  const medicineIds = new Set();
  medicinesData.rows.forEach((row, i) => {
    const [id, name, desc, price, reqRx] = row;
    if (!id || isNaN(parseInt(id, 10))) throw new Error(`Invalid medicine id at row ${i + 1} in medicines.csv`);
    if (!name) throw new Error(`Empty medicine name at row ${i + 1} in medicines.csv`);
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) throw new Error(`Invalid price at row ${i + 1} in medicines.csv`);
    medicineIds.add(parseInt(id, 10));
  });

  // Validate branch_stock foreign keys
  stockData.rows.forEach((row, i) => {
    const [id, branchId, medicineId, quantity, lowThreshold, reserved] = row;
    const bId = parseInt(branchId, 10);
    const mId = parseInt(medicineId, 10);
    if (!branchIds.has(bId)) throw new Error(`Foreign key error: branch_id ${bId} in branch_stock row ${i + 1} does not exist in branches.csv`);
    if (!medicineIds.has(mId)) throw new Error(`Foreign key error: medicine_id ${mId} in branch_stock row ${i + 1} does not exist in medicines.csv`);
    if (parseInt(quantity, 10) < 0) throw new Error(`Negative stock quantity at row ${i + 1} in branch_stock.csv`);
  });

  // Validate medicine_substitutions foreign keys
  subsData.rows.forEach((row, i) => {
    const [id, medId, subId] = row;
    const mId = parseInt(medId, 10);
    const sId = parseInt(subId, 10);
    if (!medicineIds.has(mId)) throw new Error(`Foreign key error: medicine_id ${mId} in row ${i + 1} does not exist in medicines.csv`);
    if (!medicineIds.has(sId)) throw new Error(`Foreign key error: substitute_medicine_id ${sId} in row ${i + 1} does not exist in medicines.csv`);
  });

  console.log('✓ All 4 CSV datasets validated successfully!');
  console.log(`- Branches: ${branchIds.size} records`);
  console.log(`- Medicines: ${medicineIds.size} records`);
  console.log(`- Branch Stock: ${stockData.rows.length} records`);
  console.log(`- Medicine Substitutions: ${subsData.rows.length} records`);
}

if (require.main === module) {
  try {
    validateDatasets();
  } catch (err) {
    console.error('CSV Validation Error:', err.message);
    process.exit(1);
  }
}

module.exports = { validateDatasets, parseCSV };
