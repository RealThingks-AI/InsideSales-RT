import AccountTable from "@/components/AccountTable";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, MoreVertical, Upload, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccountsImportExport } from "@/hooks/useAccountsImportExport";
import { AccountDeleteConfirmDialog } from "@/components/AccountDeleteConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Accounts = () => {
  const { toast } = useToast();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { handleImport, handleExport, isImporting } = useAccountsImportExport(() => {
    setRefreshTrigger(prev => prev + 1);
  });

  const handleBulkDeleteClick = () => {
    if (selectedAccounts.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      handleImport(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive"
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Accounts</h1>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span></span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Columns</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {selectedAccounts.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleBulkDeleteClick} disabled={isDeleting}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDeleting ? 'Deleting...' : `Delete Selected (${selectedAccounts.length})`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowColumnCustomizer(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Columns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkDeleteClick} 
                disabled={selectedAccounts.length === 0 || isDeleting} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : `Delete Selected (${selectedAccounts.length})`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Hidden file input */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".csv" 
        onChange={handleFileSelect} 
        style={{ display: 'none' }} 
      />

      {/* Account Table */}
      <AccountTable 
        showColumnCustomizer={showColumnCustomizer} 
        setShowColumnCustomizer={setShowColumnCustomizer} 
        showModal={showModal} 
        setShowModal={setShowModal} 
        selectedAccounts={selectedAccounts} 
        setSelectedAccounts={setSelectedAccounts} 
        key={refreshTrigger}
        onBulkDeleteComplete={() => {
          setSelectedAccounts([]);
          setRefreshTrigger(prev => prev + 1);
          setShowBulkDeleteDialog(false);
        }}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AccountDeleteConfirmDialog 
        open={showBulkDeleteDialog} 
        onConfirm={async () => {
          setIsDeleting(true);
          // Deletion will be handled by AccountTable
          setShowBulkDeleteDialog(false);
          setIsDeleting(false);
        }} 
        onCancel={() => setShowBulkDeleteDialog(false)} 
        isMultiple={true} 
        count={selectedAccounts.length} 
      />
    </div>
  );
};

export default Accounts;
