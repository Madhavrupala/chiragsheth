// Supabase Configuration
const SUPABASE_URL = 'https://uaydnvnzeqkksfrmzgtl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheWRudm56ZXFra3Nmcm16Z3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODA3OTQsImV4cCI6MjA2NTc1Njc5NH0.YQxh5Gssuz-Nz-HpBHyXbQ0XD1Im4Shz3yeGKWic2yg'

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Initialize projects array
let projects = [];
let currentProjectId = null;

// Authentication state
let isAuthenticated = false;

// CSV file operations
function saveToCSV() {
    // Create CSV header
    let csvContent = 'H2S No,Project Name,Architect Name,Total Fees,Billed Amount,Received Amount,Receivable,To be Billed,%Billed\n';
    
    // Add project data
    projects.forEach(project => {
        const billedAmount = project.billing.reduce((sum, b) => sum + b.amount, 0);
        const receivedAmount = project.receipts.reduce((sum, r) => sum + r.amount, 0);
        const receivable = billedAmount - receivedAmount;
        const toBeBilled = project.totalFees - billedAmount;
        const billedPercentage = ((billedAmount / project.totalFees) * 100).toFixed(2);
        
        csvContent += `${project.h2sNo},${project.projectName},${project.architectName},${project.totalFees},${billedAmount},${receivedAmount},${receivable},${toBeBilled},${billedPercentage}\n`;
    });

    // Also save the full project data for future loading
    let detailedCsvContent = '';
    projects.forEach(project => {
        const feesStr = JSON.stringify(project.fees).replace(/,/g, ';');
        const billingStr = JSON.stringify(project.billing).replace(/,/g, ';');
        const receiptStr = JSON.stringify(project.receipts).replace(/,/g, ';');
        
        detailedCsvContent += `${project.h2sNo},${project.projectName},${project.architectName},${project.totalFees},${feesStr},${billingStr},${receiptStr}\n`;
    });

    // Save to localStorage for persistence
    localStorage.setItem('projectsData', JSON.stringify(projects));
    
    // Create a file with current date in name
    const date = new Date().toISOString().split('T')[0];
    const filename = `projects_${date}.csv`;
    
    // Save summary version
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Also save detailed version for future loading
    const detailedFilename = `projects_detailed_${date}.csv`;
    const detailedBlob = new Blob([detailedCsvContent], { type: 'text/csv;charset=utf-8;' });
    const detailedLink = document.createElement('a');
    detailedLink.href = URL.createObjectURL(detailedBlob);
    detailedLink.download = detailedFilename;
    document.body.appendChild(detailedLink);
    detailedLink.click();
    document.body.removeChild(detailedLink);

    // Auto-load on startup
    const savedData = localStorage.getItem('projectsData');
    if (savedData) {
        projects = JSON.parse(savedData);
        updateDashboard();
    }
}

// CSV file operations
function loadFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const rows = text.split('\n');
                
                projects = [];
                for(let i = 1; i < rows.length; i++) {
                    if(!rows[i].trim()) continue;
                    
                    const cols = rows[i].split(',');
                    if(cols.length < 7) continue;
                    
                    const project = {
                        h2sNo: cols[0],
                        projectName: cols[1],
                        architectName: cols[2],
                        totalFees: parseFloat(cols[3]) || 0,
                        fees: JSON.parse(cols[4].replace(/;/g, ',') || '[]'),
                        billing: JSON.parse(cols[5].replace(/;/g, ',') || '[]'),
                        receipts: JSON.parse(cols[6].replace(/;/g, ',') || '[]')
                    };
                    projects.push(project);
                }
                
                // Save to localStorage
                localStorage.setItem('projectsData', JSON.stringify(projects));
                
                updateDashboard();
                alert('Data loaded and saved successfully!');
            } catch(err) {
                console.error('Error parsing CSV:', err);
                alert('Error loading data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Auto-save functionality
async function autoSave() {
    const jsonData = JSON.stringify(projects, null, 2);
    
    try {
        const response = await fetch('/data/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData
        });
        
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
        return false;
    }
    return true;
}

// Show storage information
function showStorageInfo() {
    const message = `Storage Information:

1. JSON Storage:
   - ${projects.length} projects stored
   - Click "Save to JSON" in Data Management to save
   - Location: Your chosen directory
   
2. Excel Export:
   - File name: business_management_data.xlsx
   - Created when you click "Export to Excel"
   - Location: Your chosen directory

Note: To ensure your data is safe:
- Regularly save to JSON or Excel
- Keep multiple backups
- Store backups in different locations`;

    alert(message);
}

// Backup all data
function backupAllData() {
    // Save to JSON
    saveToJSON();
    
    // Export to Excel
    exportToExcel();
    
    alert('Backup completed!\n\n1. Data saved to JSON file\n2. Excel file exported');
}

// Save data to JSON file
function saveToJSON() {
    const jsonData = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Save data to CSV file
function saveToCSV() {
    // Create CSV header
    let csvContent = 'H2S No,Project Name,Architect Name,Total Fees,Billed Amount,Received Amount,Receivable,To be Billed,%Billed\n';
    
    // Add project data
    projects.forEach(project => {
        const billedAmount = project.billing.reduce((sum, b) => sum + b.amount, 0);
        const receivedAmount = project.receipts.reduce((sum, r) => sum + r.amount, 0);
        const receivable = billedAmount - receivedAmount;
        const toBeBilled = project.totalFees - billedAmount;
        const billedPercentage = ((billedAmount / project.totalFees) * 100).toFixed(2);
        
        csvContent += `${project.h2sNo},${project.projectName},${project.architectName},${project.totalFees},${billedAmount},${receivedAmount},${receivable},${toBeBilled},${billedPercentage}%\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'projects.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import data from JSON/CSV/Excel
function importData() {
    const input = document.getElementById('excelFileInput');
    input.accept = '.json,.csv,.xlsx,.xls';
    input.onchange = handleFileImport;
    input.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileType = file.name.split('.').pop().toLowerCase();

    reader.onload = function(e) {
        try {
            let importedData;
            
            if (fileType === 'json') {
                importedData = JSON.parse(e.target.result);
                projects = importedData;
            } else if (fileType === 'csv') {
                // Parse CSV
                const rows = e.target.result.split('\n');
                const headers = rows[0].split(',');
                importedData = rows.slice(1).map(row => {
                    const values = row.split(',');
                    return {
                        h2sNo: values[0],
                        projectName: values[1],
                        architectName: values[2],
                        totalFees: parseFloat(values[3]) || 0,
                        fees: [],
                        billing: [],
                        receipts: [],
                        createdAt: new Date().toISOString()
                    };
                }).filter(project => project.h2sNo);
                projects = importedData;
            } else if (fileType === 'xlsx' || fileType === 'xls') {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                importedData = XLSX.utils.sheet_to_json(worksheet);
                
                projects = importedData.map(row => ({
                    h2sNo: row['H2S No'] || '',
                    projectName: row['Project Name'] || '',
                    architectName: row['Architect Name'] || '',
                    totalFees: parseFloat(row['Total Fees']) || 0,
                    fees: [],
                    billing: [],
                    receipts: [],
                    createdAt: new Date().toISOString()
                }));
            }

            updateDashboard();
            alert('Data imported successfully!');
        } catch (err) {
            console.error(err);
            alert('Error importing data: ' + err.message);
        }
    };

    if (fileType === 'xlsx' || fileType === 'xls') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

// Excel Export/Import functions
function exportToExcel() {
    // Prepare data for export
    const exportData = projects.map(project => ({
        'H2S No': project.h2sNo,
        'Project Name': project.projectName,
        'Architect Name': project.architectName,
        'Total Fees': project.totalFees,
        'Billed Amount': project.billing.reduce((sum, b) => sum + b.amount, 0),
        'Received Amount': project.receipts.reduce((sum, r) => sum + r.amount, 0),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");

    // Save file
    XLSX.writeFile(wb, "business_management_data.xlsx");
}

function importFromExcel() {
    document.getElementById('excelFileInput').click();
}

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Convert Excel data to our format
            const importedProjects = jsonData.map(row => ({
                h2sNo: row['H2S No'] || '',
                projectName: row['Project Name'] || '',
                architectName: row['Architect Name'] || '',
                totalFees: parseFloat(row['Total Fees']) || 0,
                fees: [],
                billing: [],
                receipts: [],
                createdAt: new Date().toISOString()
            }));

            // Merge with existing projects or replace them
            if (confirm('Do you want to merge with existing projects? Click OK to merge, Cancel to replace.')) {
                projects = [...projects, ...importedProjects];
            } else {
                projects = importedProjects;
            }

            localStorage.setItem('projects', JSON.stringify(projects));
            updateDashboard();
            alert('Data imported successfully!');
        } catch (err) {
            console.error(err);
            alert('Error importing data: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Database Operations
async function loadProjects() {
    console.log('Loading projects...');
    try {
        // Load all projects with their related data
        const { data, error } = await supabaseClient
            .from('projects')
            .select(`
                id,
                h2s_no,
                project_name,
                architect_name,
                total_fees,
                created_at,
                fees (
                    id,
                    particular,
                    amount
                ),
                billing (
                    id,
                    percentage,
                    amount,
                    invoice_no,
                    invoice_date
                ),
                receipts (
                    id,
                    check_no,
                    payment_date,
                    payment_method,
                    amount
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading projects:', error);
            throw error;
        }

        if (!data) {
            console.log('No projects found');
            projects = [];
            updateDashboard();
            return;
        }

        console.log('Loaded projects:', data);
        
        // Transform the data to match our client-side structure
        projects = data.map(project => ({
            h2sNo: project.h2s_no,
            projectName: project.project_name,
            architectName: project.architect_name,
            totalFees: project.total_fees,
            fees: (project.fees || []).map(fee => ({
                particular: fee.particular,
                amount: fee.amount
            })),
            billing: (project.billing || []).map(bill => ({
                percentage: bill.percentage,
                amount: bill.amount,
                invoiceNo: bill.invoice_no,
                date: bill.invoice_date
            })),
            receipts: (project.receipts || []).map(receipt => ({
                checkNo: receipt.check_no,
                date: receipt.payment_date,
                method: receipt.payment_method,
                amount: receipt.amount
            }))
        }));
        
        updateDashboard();
    } catch (error) {
        console.error('Error in loadProjects:', error);
        alert('Error loading projects: ' + (error.message || 'Please try again'));
    }
}

async function saveProject(project) {
    console.log('Saving project:', project);
    try {
        // Validate required fields
        if (!project.h2sNo || !project.projectName) {
            throw new Error('H2S No and Project Name are required');
        }

        // Clean and prepare the data
        const projectData = {
            h2s_no: project.h2sNo.trim(),
            project_name: project.projectName.trim(),
            architect_name: project.architectName?.trim() || null,
            total_fees: project.totalFees || 0
        };

        console.log('Project data to save:', projectData);

        // First check if project exists
        const { data: existingProjects, error: checkError } = await supabaseClient
            .from('projects')
            .select('id')
            .eq('h2s_no', projectData.h2s_no);
            
        if (checkError) {
            console.error('Error checking existing project:', checkError);
            throw checkError;
        }

        const existingProject = existingProjects?.[0];
        let projectId;
        
        if (existingProject) {
            console.log('Updating existing project:', existingProject.id);
            // Update existing project
            const { data: updatedProjects, error: updateError } = await supabaseClient
                .from('projects')
                .update(projectData)
                .eq('id', existingProject.id)
                .select();
                
            if (updateError) {
                console.error('Error updating project:', updateError);
                throw updateError;
            }
            
            const updatedProject = updatedProjects?.[0];
            if (!updatedProject) {
                throw new Error('Failed to update project');
            }
            
            projectId = existingProject.id;

            // Delete existing related records
            console.log('Deleting existing related records for project:', projectId);
            const deletePromises = [
                supabaseClient.from('fees').delete().eq('project_id', projectId),
                supabaseClient.from('billing').delete().eq('project_id', projectId),
                supabaseClient.from('receipts').delete().eq('project_id', projectId)
            ];
            
            const deleteResults = await Promise.all(deletePromises);
            deleteResults.forEach((result, index) => {
                if (result.error) {
                    console.error(`Error deleting ${['fees', 'billing', 'receipts'][index]}:`, result.error);
                }
            });
        } else {
            console.log('Creating new project');
            // Insert new project
            const { data: newProjects, error: insertError } = await supabaseClient
                .from('projects')
                .insert(projectData)
                .select();
                
            if (insertError) {
                console.error('Error inserting project:', insertError);
                throw insertError;
            }
            
            const newProject = newProjects?.[0];
            if (!newProject) {
                throw new Error('Failed to create project');
            }
            
            projectId = newProject.id;
        }

        // Insert fees
        if (project.fees?.length > 0) {
            console.log('Inserting fees:', project.fees);
            const feesData = project.fees
                .filter(fee => fee.particular || fee.amount)
                .map(fee => ({
                    project_id: projectId,
                    particular: fee.particular.trim(),
                    amount: fee.amount
                }));
                
            if (feesData.length > 0) {
                const { error: feesError } = await supabaseClient
                    .from('fees')
                    .insert(feesData);
                    
                if (feesError) {
                    console.error('Error inserting fees:', feesError);
                    throw feesError;
                }
            }
        }
        
        // Insert billing
        if (project.billing?.length > 0) {
            console.log('Inserting billing:', project.billing);
            const billingData = project.billing
                .filter(bill => bill.percentage || bill.invoiceNo)
                .map(bill => ({
                    project_id: projectId,
                    percentage: bill.percentage,
                    amount: bill.amount,
                    invoice_no: bill.invoiceNo?.trim(),
                    invoice_date: bill.date || null
                }));
                
            if (billingData.length > 0) {
                const { error: billingError } = await supabaseClient
                    .from('billing')
                    .insert(billingData);
                    
                if (billingError) {
                    console.error('Error inserting billing:', billingError);
                    throw billingError;
                }
            }
        }
        
        // Insert receipts
        if (project.receipts?.length > 0) {
            console.log('Inserting receipts:', project.receipts);
            const receiptsData = project.receipts
                .filter(receipt => receipt.checkNo || receipt.amount)
                .map(receipt => ({
                    project_id: projectId,
                    check_no: receipt.checkNo?.trim(),
                    payment_date: receipt.date,
                    payment_method: receipt.method,
                    amount: receipt.amount
                }));
                
            if (receiptsData.length > 0) {
                const { error: receiptsError } = await supabaseClient
                    .from('receipts')
                    .insert(receiptsData);
                    
                if (receiptsError) {
                    console.error('Error inserting receipts:', receiptsError);
                    throw receiptsError;
                }
            }
        }
        
        console.log('Project saved successfully');
        await loadProjects(); // Reload to get fresh data
        alert('Project saved successfully!');
        return true;
    } catch (error) {
        console.error('Error in saveProject:', error);
        alert('Error saving project: ' + (error.message || 'Please try again'));
        return false;
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Check for hardcoded credentials
    if (username === 'CS' && password === 'CS') {
        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        handleSuccessfulLogin();
        return false;
    } else {
        alert('Invalid credentials. Please try again.');
        return false;
    }
}

function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        handleSuccessfulLogin();
    }
}

function handleSuccessfulLogin() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadProjects(); // Load projects after successful login
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    projects = [];
    updateDashboard();
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Show/Hide sections
function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('projectForm').style.display = 'none';
    updateDashboard();
}

function showProjectForm(mode) {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('projectForm').style.display = 'block';
    
    const projectSelector = document.getElementById('projectSelector');
    const submitButton = document.querySelector('#addProjectForm button[type="submit"]');
    
    if (mode === 'edit') {
        projectSelector.style.display = 'block';
        submitButton.textContent = 'Update Project';
        populateProjectDropdown();
    } else {
        projectSelector.style.display = 'none';
        submitButton.textContent = 'Save Project';
        document.getElementById('addProjectForm').reset();
        currentProjectId = null;
    }
}

function populateProjectDropdown() {
    const select = document.getElementById('existingProject');
    select.innerHTML = '<option value="">Select H2S No/Job No</option>';
    
    projects.forEach((project, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = project.h2sNo;
        select.appendChild(option);
    });
}

function loadProjectDetails() {
    const select = document.getElementById('existingProject');
    const index = select.value;
    
    if (index === '') {
        document.getElementById('addProjectForm').reset();
        return;
    }
    
    const project = projects[index];
    currentProjectId = index;
    
    // Fill in basic details
    document.getElementById('h2sNo').value = project.h2sNo;
    document.getElementById('projectName').value = project.projectName;
    document.getElementById('architectName').value = project.architectName;
    
    // Clear existing rows
    document.getElementById('feesTableBody').innerHTML = '';
    document.getElementById('billingTableBody').innerHTML = '';
    document.getElementById('receiptTableBody').innerHTML = '';
    
    // Add fees rows
    project.fees.forEach(fee => {
        const row = addFeesRow();
        row.cells[1].querySelector('input').value = fee.particular;
        row.cells[2].querySelector('input').value = fee.amount;
    });
    
    // Add billing rows
    project.billing.forEach(bill => {
        const row = addBillingRow();
        row.cells[0].querySelector('input').value = bill.percentage;
        row.cells[2].querySelector('input').value = bill.invoiceNo;
        row.cells[3].querySelector('input').value = bill.date;
    });
    
    // Add receipt rows
    project.receipts.forEach(receipt => {
        const row = addReceiptRow();
        row.cells[0].querySelector('input').value = receipt.checkNo;
        row.cells[1].querySelector('input').value = receipt.date;
        row.cells[2].querySelector('select').value = receipt.method;
        row.cells[3].querySelector('input').value = receipt.amount;
    });
    
    updateFeesTotal();
}

// Fees Table Functions
function updateFeesTotal() {
    const amounts = [...document.getElementsByClassName('fees-amount')].map(input => parseFloat(input.value) || 0);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    document.getElementById('feesTotal').textContent = total.toLocaleString();
    updateBillingAmounts();
}

function addFeesRow() {
    const tbody = document.getElementById('feesTableBody');
    const newRow = document.createElement('tr');
    const rowCount = tbody.children.length + 1;
    
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="number" class="form-control fees-amount"></td>
        <td><button type="button" class="btn btn-danger btn-sm">Delete</button></td>
    `;
    
    tbody.appendChild(newRow);
    attachFeesListeners(newRow);
    return newRow;
}

function attachFeesListeners(row) {
    const deleteBtn = row.querySelector('.btn-danger');
    const amountInput = row.querySelector('.fees-amount');
    
    deleteBtn.addEventListener('click', () => {
        row.remove();
        updateFeesTotal();
        renumberRows('feesTableBody');
    });
    
    amountInput.addEventListener('input', updateFeesTotal);
}

// Billing Table Functions
function updateBillingAmounts() {
    const totalFees = parseFloat(document.getElementById('feesTotal').textContent.replace(/,/g, '')) || 0;
    const percentageInputs = document.getElementsByClassName('billing-percentage');
    const amountCells = document.getElementsByClassName('billing-amount');
    
    [...percentageInputs].forEach((input, index) => {
        const percentage = parseFloat(input.value) || 0;
        const amount = (totalFees * percentage) / 100;
        amountCells[index].textContent = amount.toLocaleString();
    });
}

function addBillingRow() {
    const tbody = document.getElementById('billingTableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="number" class="form-control billing-percentage"></td>
        <td class="billing-amount">0</td>
        <td><input type="text" class="form-control"></td>
        <td><input type="date" class="form-control"></td>
        <td><button type="button" class="btn btn-danger btn-sm">Delete</button></td>
    `;
    
    tbody.appendChild(newRow);
    attachBillingListeners(newRow);
    return newRow;
}

function attachBillingListeners(row) {
    const deleteBtn = row.querySelector('.btn-danger');
    const percentageInput = row.querySelector('.billing-percentage');
    
    deleteBtn.addEventListener('click', () => row.remove());
    percentageInput.addEventListener('input', updateBillingAmounts);
}

// Receipt Table Functions
function addReceiptRow() {
    const tbody = document.getElementById('receiptTableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" class="form-control"></td>
        <td><input type="date" class="form-control"></td>
        <td>
            <select class="form-select">
                <option value="">Select</option>
                <option value="Check">Check</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
            </select>
        </td>
        <td><input type="number" class="form-control receipt-amount"></td>
        <td><button type="button" class="btn btn-danger btn-sm">Delete</button></td>
    `;
    
    tbody.appendChild(newRow);
    attachReceiptListeners(newRow);
    return newRow;
}

function attachReceiptListeners(row) {
    const deleteBtn = row.querySelector('.btn-danger');
    deleteBtn.addEventListener('click', () => row.remove());
}

function renumberRows(tableBodyId) {
    const rows = document.getElementById(tableBodyId).getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        rows[i].cells[0].textContent = (i + 1).toString();
    }
}

// Load data from server
async function loadData() {
    try {
        const response = await fetch('/data/load');
        projects = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
        projects = [];
    }
}

// Helper functions to collect form data
function getFeesRows() {
    return [...document.getElementById('feesTableBody').getElementsByTagName('tr')].map(row => ({
        particular: row.cells[1].querySelector('input').value,
        amount: parseFloat(row.cells[2].querySelector('input').value) || 0
    })).filter(fee => fee.particular || fee.amount);
}

function getBillingRows() {
    return [...document.getElementById('billingTableBody').getElementsByTagName('tr')].map(row => ({
        percentage: parseFloat(row.cells[0].querySelector('input').value) || 0,
        amount: parseFloat(row.cells[1].textContent.replace(/,/g, '')) || 0,
        invoiceNo: row.cells[2].querySelector('input').value,
        date: row.cells[3].querySelector('input').value
    })).filter(bill => bill.percentage || bill.invoiceNo);
}

function getReceiptRows() {
    return [...document.getElementById('receiptTableBody').getElementsByTagName('tr')].map(row => ({
        checkNo: row.cells[0].querySelector('input').value,
        date: row.cells[1].querySelector('input').value,
        method: row.cells[2].querySelector('select').value,
        amount: parseFloat(row.cells[3].querySelector('input').value) || 0
    })).filter(receipt => receipt.checkNo || receipt.amount);
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to load data from Supabase when page loads
    await loadProjects();
    
    // Attach event listeners
    document.querySelectorAll('#feesTableBody tr').forEach(attachFeesListeners);
    document.querySelectorAll('#billingTableBody tr').forEach(attachBillingListeners);
    document.querySelectorAll('#receiptTableBody tr').forEach(attachReceiptListeners);
    
    // Add form submission handler
    document.getElementById('addProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        try {
            const project = {
                h2sNo: document.getElementById('h2sNo').value,
                projectName: document.getElementById('projectName').value,
                architectName: document.getElementById('architectName').value,
                totalFees: parseFloat(document.getElementById('feesTotal').textContent.replace(/,/g, '')) || 0,
                fees: getFeesRows(),
                billing: getBillingRows(),
                receipts: getReceiptRows()
            };
            
            const saved = await saveProject(project);
            if (saved) {
                e.target.reset();
                showDashboard();
            }
        } catch (error) {
            console.error('Error in form submission:', error);
            alert('Failed to save project. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Project';
        }
    });
});

// Update dashboard with current data
function updateDashboard() {
    const tableBody = document.getElementById('dashboardTable');
    tableBody.innerHTML = '';

    projects.forEach(project => {
        const totalBilled = project.billing.reduce((sum, bill) => sum + bill.amount, 0);
        const totalReceived = project.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
        const receivable = totalBilled - totalReceived;
        const toBeBilled = project.totalFees - totalBilled;
        const billedPercentage = ((totalBilled / project.totalFees) * 100).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${project.h2sNo}</td>
            <td>${project.projectName}</td>
            <td>${project.architectName}</td>
            <td>${project.totalFees.toLocaleString()}</td>
            <td>${totalBilled.toLocaleString()}</td>
            <td>${totalReceived.toLocaleString()}</td>
            <td>${receivable.toLocaleString()}</td>
            <td>${toBeBilled.toLocaleString()}</td>
            <td>${billedPercentage}%</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showProjectForm('edit'); loadProjectDetails('${project.h2sNo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="confirmDeleteProject('${project.h2sNo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
