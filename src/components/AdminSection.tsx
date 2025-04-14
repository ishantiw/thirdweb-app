import { useState, useEffect } from "react";
import axios from 'axios';

export function AdminSection() {
	const [projectName, setProjectName] = useState("");
	const [projectDomain, setProjectDomain] = useState("");
	const [domains, setDomains] = useState<string[]>([]);
	const [creating, setCreating] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
	const [projects, setProjects] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
	
	// Project settings editing
	const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
	const [editingProjectName, setEditingProjectName] = useState<string>("");
	const [maxSpend, setMaxSpend] = useState<string>("100");
	const [contractAddress, setContractAddress] = useState<string>("");
	const [allowedContractAddresses, setAllowedContractAddresses] = useState<string[]>([]);
	const [allowlistWalletAddress, setAllowlistWalletAddress] = useState<string>("");
	const [blocklistWalletAddress, setBlocklistWalletAddress] = useState<string>("");
	const [allowedWallets, setAllowedWallets] = useState<string[]>([]);
	const [blockedWallets, setBlockedWallets] = useState<string[]>([]);
	const [updatingSettings, setUpdatingSettings] = useState(false);

	// Fetch projects when component mounts
	useEffect(() => {
		fetchProjects();
	}, []);

	const fetchProjects = async (preserveMessage = false) => {
		setLoading(true);
		// Clear any existing result messages when refreshing, unless preserveMessage is true
		if (!preserveMessage) {
			setResult(null);
		}
		
		try {
			const response = await axios.get('http://localhost:3000/api/list-projects');
			console.log('Raw response:', response.data);
			
			// Check if the proxy server has already parsed the data for us
			if (response.data && response.data.projects && Array.isArray(response.data.projects)) {
				setProjects(response.data.projects);
				console.log('Projects from parsed response:', response.data.projects);
				return;
			}
			
			// Fallback to string parsing if the server returns the raw data
			if (typeof response.data === 'string') {
				// Find the position where the second object starts
				const secondObjectStart = response.data.indexOf('1:');
				if (secondObjectStart !== -1) {
					try {
						// Extract the JSON string for the second object
						const jsonString = response.data.substring(secondObjectStart + 2);
						const parsedData = JSON.parse(jsonString);
						
						if (parsedData && parsedData.data && parsedData.data.result) {
							setProjects(parsedData.data.result);
							console.log('Successfully parsed projects from string:', parsedData.data.result);
							return;
						}
					} catch (parseError) {
						console.error('Error parsing JSON:', parseError);
					}
				}
			} else if (response.data && 
				response.data[1] && 
				response.data[1].data && 
				response.data[1].data.result) {
				// Try the previous approach if the response is an array
				setProjects(response.data[1].data.result || []);
				console.log('Parsed projects from array format:', response.data[1].data.result);
				return;
			}
			
			console.error('Unexpected response format:', response.data);
			setProjects([]);
		} catch (error) {
			console.error('Error fetching projects:', error);
			setProjects([]);
			// Show error message when fetching fails
			setResult({
				success: false,
				message: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		} finally {
			setLoading(false);
		}
	};

	const deleteProject = async (projectId: string, projectName: string) => {
		try {
			setDeleting(projectId);
			setResult(null);

			const response = await axios.delete(`http://localhost:3000/api/delete-project/${projectId}?name=${encodeURIComponent(projectName)}`);
			console.log('Delete response:', response.data);

			if (response.data && response.data.success) {
				// Show success message
				setResult({
					success: true,
					message: response.data.message || `Project deleted successfully!`
				});

				// Remove the project from the list
				setProjects(projects.filter(project => project.id !== projectId));
			} else {
				// Show error message
				setResult({
					success: false,
					message: response.data.message || `Failed to delete project`
				});
			}
			
			// Clear confirmation dialog
			setShowDeleteConfirm(null);

		} catch (error) {
			console.error('Error deleting project:', error);
			setResult({
				success: false,
				message: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		} finally {
			setDeleting(null);
		}
	};

	const addDomain = () => {
		// Clear any messages when modifying domains
		setResult(null);
		
		if (projectDomain && !domains.includes(projectDomain)) {
			setDomains([...domains, projectDomain]);
			setProjectDomain("");
		}
	};

	const removeDomain = (domain: string) => {
		// Clear any messages when modifying domains
		setResult(null);
		
		setDomains(domains.filter(d => d !== domain));
	};

	const createProject = async () => {
		if (!projectName || domains.length === 0) {
			setResult({
				success: false,
				message: "Project name and at least one domain are required"
			});
			return;
		}

		setCreating(true);
		setResult(null);

		try {
			const data = [{
				pathname: `/v1/teams/${import.meta.env.VITE_TEAM_ID || ''}/projects`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: projectName,
					domains: domains,
					services: [
						{ name: 'storage', actions: ['read', 'write'] },
						{ name: 'rpc', actions: [] },
						{ name: 'bundler', actions: [] },
						{ name: 'embeddedWallets', actions: [] },
						{ name: 'pay', payoutAddress: null, actions: [] },
						{ name: 'insight', actions: [] }
					]
				})
			}];

			const response = await axios.post('http://localhost:3000/api/create-project', data);
			console.log('Create project response:', response.data);
			
			setResult({
				success: true,
				message: `Project "${projectName}" created successfully!`
			});
			
			// Reset form
			setProjectName("");
			setDomains([]);
			
			// Refresh the project list
			fetchProjects(true);

		} catch (error) {
			console.error('Error creating project:', error);
			setResult({
				success: false,
				message: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		} finally {
			setCreating(false);
		}
	};
	
	// Clear result message when user starts typing in fields
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
		// Clear result messages when user starts editing
		setResult(null);
		setter(e.target.value);
	};

	// Helper function to check if an array is not empty and doesn't just contain an empty string
	const isValidArray = (arr: any[]): boolean => {
		return Array.isArray(arr) && 
		       arr.length > 0 && 
		       !(arr.length === 1 && arr[0] === "");
	};

	// Initialize edit form with current project settings
	const initializeEditSettings = (project: any) => {
		setEditingProjectId(project.id);
		setEditingProjectName(project.name);
		
		// Find bundler service in the project
		const bundlerService = project.services?.find((service: any) => service.name === 'bundler');
		
		// Set maxSpend from project or default
		setMaxSpend(bundlerService?.limits?.global?.maxSpend || "100");
		
		// Set allowedContractAddresses from project or empty array
		setAllowedContractAddresses(bundlerService?.allowedContractAddresses || []);
		
		// Set allowedWallets and blockedWallets from project or empty arrays
		// Handle the case where thirdweb API returns [""] for empty arrays
		const rawAllowedWallets = bundlerService?.allowedWallets || [];
		const rawBlockedWallets = bundlerService?.blockedWallets || [];
		
		setAllowedWallets(isValidArray(rawAllowedWallets) ? rawAllowedWallets : []);
		setBlockedWallets(isValidArray(rawBlockedWallets) ? rawBlockedWallets : []);
		
		// Reset form inputs
		setContractAddress("");
		setAllowlistWalletAddress("");
		setBlocklistWalletAddress("");
	};
	
	// Add contract address to the list
	const addContractAddress = () => {
		if (contractAddress && !allowedContractAddresses.includes(contractAddress)) {
			// Ensure we're not adding to a [""] array
			const newAllowedContractAddresses = isValidArray(allowedContractAddresses) ? 
				[...allowedContractAddresses, contractAddress] : 
				[contractAddress];
			
			setAllowedContractAddresses(newAllowedContractAddresses);
			setContractAddress("");
		}
	};
	
	// Remove contract address from the list
	const removeContractAddress = (address: string) => {
		setAllowedContractAddresses(allowedContractAddresses.filter(a => a !== address));
	};
	
	// Add wallet to allowed list
	const addAllowedWallet = () => {
		if (allowlistWalletAddress && !allowedWallets.includes(allowlistWalletAddress)) {
			// Ensure we're not adding to a [""] array
			const newAllowedWallets = isValidArray(allowedWallets) ? 
				[...allowedWallets, allowlistWalletAddress] : 
				[allowlistWalletAddress];
			
			setAllowedWallets(newAllowedWallets);
			setAllowlistWalletAddress("");
		}
	};
	
	// Remove wallet from allowed list
	const removeAllowedWallet = (address: string) => {
		setAllowedWallets(allowedWallets.filter(a => a !== address));
	};
	
	// Add wallet to blocked list
	const addBlockedWallet = () => {
		if (blocklistWalletAddress && !blockedWallets.includes(blocklistWalletAddress)) {
			// Ensure we're not adding to a [""] array
			const newBlockedWallets = isValidArray(blockedWallets) ? 
				[...blockedWallets, blocklistWalletAddress] : 
				[blocklistWalletAddress];
			
			setBlockedWallets(newBlockedWallets);
			setBlocklistWalletAddress("");
		}
	};
	
	// Remove wallet from blocked list
	const removeBlockedWallet = (address: string) => {
		setBlockedWallets(blockedWallets.filter(a => a !== address));
	};
	
	// Cancel editing and reset form
	const cancelEditSettings = () => {
		setEditingProjectId(null);
		setEditingProjectName("");
		setMaxSpend("100");
		setContractAddress("");
		setAllowedContractAddresses([]);
		setAllowlistWalletAddress("");
		setBlocklistWalletAddress("");
		setAllowedWallets([]);
		setBlockedWallets([]);
	};
	
	// Save project settings
	const saveProjectSettings = async () => {
		if (!editingProjectId) return;
		
		setUpdatingSettings(true);
		setResult(null);
		
		try {
			const response = await axios.put(
				`http://localhost:3000/api/update-project-settings/${editingProjectId}?name=${encodeURIComponent(editingProjectName)}`,
				{
					maxSpend,
					allowedContractAddresses: allowedContractAddresses.length > 0 ? allowedContractAddresses : null,
					allowedWallets: allowedWallets.length > 0 ? allowedWallets : null,
					blockedWallets: blockedWallets.length > 0 ? blockedWallets : null
				}
			);
			
			console.log('Update settings response:', response.data);
			
			if (response.data && response.data.success) {
				setResult({
					success: true,
					message: response.data.message || `Project settings updated successfully!`
				});
				
				// Refresh the project list to show updated settings
				fetchProjects(true);
				
				// Close the edit form
				cancelEditSettings();
			} else {
				setResult({
					success: false,
					message: response.data.message || `Failed to update project settings`
				});
			}
		} catch (error) {
			console.error('Error updating project settings:', error);
			setResult({
				success: false,
				message: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`
			});
		} finally {
			setUpdatingSettings(false);
		}
	};

	return (
		<div className="bg-zinc-800 p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-white">Project Management</h2>
				<button
					onClick={() => fetchProjects()}
					className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					disabled={loading}
				>
					{loading ? "Loading..." : "Refresh Projects"}
				</button>
			</div>

			{/* Project List Section */}
			<div className="mb-8">
				<h3 className="text-xl font-semibold text-white mb-4">Projects</h3>
				{loading ? (
					<div className="text-center py-4 text-zinc-400">Loading projects...</div>
				) : projects.length > 0 ? (
					<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<div 
								key={project.id} 
								className="bg-zinc-700 p-4 rounded-lg relative"
							>
								{showDeleteConfirm === project.id && (
									<div className="absolute inset-0 bg-zinc-800 bg-opacity-95 p-4 rounded-lg flex flex-col items-center justify-center">
										<p className="text-white text-center mb-4">Are you sure you want to delete project "{project.name}"?</p>
										<div className="flex space-x-3">
											<button
												onClick={() => deleteProject(project.id, project.name)}
												disabled={deleting === project.id}
												className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
											>
												{deleting === project.id ? "Deleting..." : "Delete"}
											</button>
											<button
												onClick={() => setShowDeleteConfirm(null)}
												className="bg-zinc-600 text-white px-4 py-2 rounded-lg hover:bg-zinc-500 transition-colors"
											>
												Cancel
											</button>
										</div>
									</div>
								)}

								<div className="flex justify-between items-start">
									<h4 className="text-lg font-medium text-white truncate">{project.name}</h4>
									<div className="flex space-x-2">
										<button 
											onClick={() => {
												setResult(null); // Clear any messages
												initializeEditSettings(project);
											}}
											className="text-blue-400 hover:text-blue-300 text-sm"
										>
											Edit Settings
										</button>
										<button 
											onClick={() => {
												setResult(null); // Clear any messages
												setShowDeleteConfirm(project.id);
											}}
											className="text-red-400 hover:text-red-300 text-sm"
										>
											Delete
										</button>
									</div>
								</div>
								<p className="text-zinc-400 text-sm">ID: {project.id}</p>
								
								{project.domains && project.domains.length > 0 && (
									<>
										<p className="mt-2 text-zinc-300 text-sm font-medium">Domains:</p>
										<ul className="mt-1 space-y-1">
											{project.domains.map((domain: string, idx: number) => (
												<li key={idx} className="text-zinc-400 text-sm">
													{domain}
												</li>
											))}
										</ul>
									</>
								)}

								{/* Display project settings */}
								{project.services && project.services.length > 0 && (
									<div className="mt-3">
										{/* Find bundler service */}
										{(() => {
											const bundlerService = project.services.find((service: any) => service.name === 'bundler');
											if (!bundlerService) return null;
											
											return (
												<>
													{/* Max Spend */}
													{bundlerService.limits?.global?.maxSpend && (
														<p className="text-zinc-400 text-sm mt-1">
															<span className="text-zinc-300">Spend Limit:</span> {bundlerService.limits.global.maxSpend} {bundlerService.limits.global.maxSpendUnit || 'USD'}
														</p>
													)}
													
													{/* Contract Restrictions */}
													{isValidArray(bundlerService.allowedContractAddresses) && (
														<div className="mt-1">
															<p className="text-zinc-300 text-sm">Restricted to {bundlerService.allowedContractAddresses.length} contract(s)</p>
														</div>
													)}
													
													{/* Wallet Lists */}
													<div className="mt-1 flex flex-wrap gap-2">
														{isValidArray(bundlerService.allowedWallets) && (
															<span className="text-green-400 text-xs bg-zinc-800 px-2 py-1 rounded">
																{bundlerService.allowedWallets.length} allowlisted wallet(s)
															</span>
														)}
														
														{isValidArray(bundlerService.blockedWallets) && (
															<span className="text-red-400 text-xs bg-zinc-800 px-2 py-1 rounded">
																{bundlerService.blockedWallets.length} blocklisted wallet(s)
															</span>
														)}
													</div>
												</>
											);
										})()}
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-4 text-zinc-400">No projects found</div>
				)}
			</div>

			{/* Project Settings Editor */}
			{editingProjectId && (
				<div className="bg-zinc-700 p-6 rounded-lg shadow-lg mb-8">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-xl font-semibold text-white">Edit Settings for "{editingProjectName}"</h3>
						<button
							onClick={cancelEditSettings}
							className="text-zinc-400 hover:text-zinc-300"
						>
							Cancel
						</button>
					</div>

					{/* Max Spend Setting */}
					<div className="mb-6">
						<h4 className="text-lg font-medium text-white mb-3">Spend Limit</h4>
						<div className="flex items-center">
							<input
								type="number"
								min="0"
								value={maxSpend}
								onChange={(e) => setMaxSpend(e.target.value)}
								className="bg-zinc-800 text-white px-4 py-2 rounded-lg w-32 mr-2"
							/>
							<span className="text-zinc-300">USD maximum spend</span>
						</div>
					</div>

					{/* Contract Addresses */}
					<div className="mb-6">
						<h4 className="text-lg font-medium text-white mb-3">Restrict to Contract Addresses</h4>
						<div className="flex mb-2">
							<input
								type="text"
								value={contractAddress}
								onChange={(e) => handleInputChange(e, setContractAddress)}
								placeholder="Enter contract address"
								className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex-grow mr-2"
							/>
							<button
								onClick={addContractAddress}
								className="bg-blue-500 text-white px-4 py-2 rounded-lg"
							>
								Add
							</button>
						</div>
						
						{allowedContractAddresses.length > 0 ? (
							<div className="mt-3">
								<p className="text-zinc-300 mb-2">Restricted to these contracts:</p>
								<ul className="space-y-2">
									{allowedContractAddresses.map((address, index) => (
										<li key={index} className="flex justify-between bg-zinc-800 px-3 py-2 rounded">
											<span className="text-white truncate">{address}</span>
											<button
												onClick={() => removeContractAddress(address)}
												className="text-red-400 hover:text-red-300 ml-2"
											>
												Remove
											</button>
										</li>
									))}
								</ul>
							</div>
						) : (
							<p className="text-zinc-400 mt-2 text-sm">No restrictions (all contracts allowed)</p>
						)}
					</div>

					{/* Wallet Lists */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* Allowed Wallets */}
						<div>
							<h4 className="text-lg font-medium text-white mb-3">Allowlisted Wallets</h4>
							<div className="flex mb-2">
								<input
									type="text"
									value={allowlistWalletAddress}
									onChange={(e) => handleInputChange(e, setAllowlistWalletAddress)}
									placeholder="Enter wallet address"
									className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex-grow mr-2"
								/>
								<button
									onClick={addAllowedWallet}
									className="bg-green-600 text-white px-4 py-2 rounded-lg"
								>
									Add
								</button>
							</div>
							
							{allowedWallets.length > 0 ? (
								<div className="mt-3">
									<ul className="space-y-2">
										{allowedWallets.map((address, index) => (
											<li key={index} className="flex justify-between bg-zinc-800 px-3 py-2 rounded">
												<span className="text-white truncate">{address}</span>
												<button
													onClick={() => removeAllowedWallet(address)}
													className="text-red-400 hover:text-red-300 ml-2"
												>
													Remove
												</button>
											</li>
										))}
									</ul>
								</div>
							) : (
								<p className="text-zinc-400 mt-2 text-sm">No wallets allowlisted</p>
							)}
						</div>

						{/* Blocked Wallets */}
						<div>
							<h4 className="text-lg font-medium text-white mb-3">Blocklisted Wallets</h4>
							<div className="flex mb-2">
								<input
									type="text"
									value={blocklistWalletAddress}
									onChange={(e) => handleInputChange(e, setBlocklistWalletAddress)}
									placeholder="Enter wallet address"
									className="bg-zinc-800 text-white px-4 py-2 rounded-lg flex-grow mr-2"
								/>
								<button
									onClick={addBlockedWallet}
									className="bg-red-600 text-white px-4 py-2 rounded-lg"
								>
									Add
								</button>
							</div>
							
							{blockedWallets.length > 0 ? (
								<div className="mt-3">
									<ul className="space-y-2">
										{blockedWallets.map((address, index) => (
											<li key={index} className="flex justify-between bg-zinc-800 px-3 py-2 rounded">
												<span className="text-white truncate">{address}</span>
												<button
													onClick={() => removeBlockedWallet(address)}
													className="text-red-400 hover:text-red-300 ml-2"
												>
													Remove
												</button>
											</li>
										))}
									</ul>
								</div>
							) : (
								<p className="text-zinc-400 mt-2 text-sm">No wallets blocklisted</p>
							)}
						</div>
					</div>

					<button
						onClick={saveProjectSettings}
						disabled={updatingSettings}
						className="bg-violet-500 text-white px-6 py-3 rounded-lg w-full hover:bg-violet-600 transition-colors disabled:bg-violet-800 disabled:cursor-not-allowed"
					>
						{updatingSettings ? "Updating Settings..." : "Save Settings"}
					</button>
				</div>
			)}

			{/* Result message that shows for both create and delete operations */}
			{result && (
				<div className={`p-3 rounded mb-4 relative ${result.success ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
					{result.message}
					<button 
						onClick={() => setResult(null)}
						className="absolute top-2 right-2 text-sm opacity-70 hover:opacity-100"
						aria-label="Dismiss message"
					>
						✕
					</button>
				</div>
			)}

			{/* Create Project Section */}
			<div className="border-t border-zinc-700 pt-6">
				<h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
				
				<div className="mb-4">
					<label className="block text-zinc-300 mb-2">Project Name</label>
					<input
						type="text"
						value={projectName}
						onChange={(e) => handleInputChange(e, setProjectName)}
						className="bg-zinc-700 text-white px-4 py-2 rounded-lg w-full"
						placeholder="Enter project name"
					/>
				</div>

				<div className="mb-4">
					<label className="block text-zinc-300 mb-2">Allowed Domains</label>
					<div className="flex mb-2">
						<input
							type="text"
							value={projectDomain}
							onChange={(e) => handleInputChange(e, setProjectDomain)}
							className="bg-zinc-700 text-white px-4 py-2 rounded-lg flex-grow mr-2"
							placeholder="e.g., *.example.com"
						/>
						<button
							onClick={addDomain}
							className="bg-blue-500 text-white px-4 py-2 rounded-lg"
						>
							Add
						</button>
					</div>
					
					{domains.length > 0 && (
						<div className="mt-3">
							<p className="text-zinc-300 mb-2">Added domains:</p>
							<ul className="space-y-2">
								{domains.map((domain, index) => (
									<li key={index} className="flex justify-between bg-zinc-700 px-3 py-2 rounded">
										<span className="text-white">{domain}</span>
										<button
											onClick={() => removeDomain(domain)}
											className="text-red-400 hover:text-red-300"
										>
											Remove
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<button
					onClick={createProject}
					disabled={creating}
					className="bg-violet-500 text-white px-6 py-3 rounded-lg w-full hover:bg-violet-600 transition-colors disabled:bg-violet-800 disabled:cursor-not-allowed"
				>
					{creating ? "Creating Project..." : "Create Project"}
				</button>
			</div>
		</div>
	);
} 