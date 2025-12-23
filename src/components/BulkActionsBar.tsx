import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Download, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({ selectedCount, onDelete, onExport, onClearSelection }: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[320px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose an action for the selected items
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="default"
                variant="outline"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export selected items to CSV</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="default"
                variant="destructive"
                onClick={onDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete selected items</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};