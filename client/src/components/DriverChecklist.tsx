import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDriverChecklistSchema, type InsertDriverChecklist } from "@shared/schema";
import { ClipboardList, Plus, Check, X, Clock } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

interface ChecklistItemType {
  id: string;
  item: string;
  isCompleted: boolean;
  notes?: string;
}

export function DriverChecklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistType, setChecklistType] = useState<string>("");
  const [items, setItems] = useState<ChecklistItemType[]>([]);

  const { data: checklists, isLoading: checklistsLoading } = useQuery({
    queryKey: ["/api/checklists"],
    retry: false,
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (data: InsertDriverChecklist) => {
      await apiRequest("POST", "/api/checklists", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist created successfully",
      });
      setChecklistType("");
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checklist",
        variant: "destructive",
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertDriverChecklist> }) => {
      await apiRequest("PATCH", `/api/checklists/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checklist updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update checklist",
        variant: "destructive",
      });
    },
  });

  const getDefaultItems = (type: string): ChecklistItemType[] => {
    const itemsMap: Record<string, string[]> = {
      "pre-trip": [
        "Check engine oil level",
        "Inspect tire pressure and condition",
        "Test brakes functionality",
        "Check fuel level",
        "Verify lights and indicators",
        "Inspect windshield and mirrors",
        "Check vehicle documents",
        "Ensure emergency kit is present"
      ],
      "post-trip": [
        "Record odometer reading",
        "Note any damage or issues",
        "Check fuel consumption",
        "Clean interior",
        "Secure vehicle",
        "Submit trip report"
      ],
      "maintenance": [
        "Check battery condition",
        "Inspect belts and hoses",
        "Test air conditioning",
        "Check coolant level",
        "Inspect suspension",
        "Test steering alignment",
        "Check exhaust system"
      ],
      "safety": [
        "Ensure seat belts work properly",
        "Test emergency brake",
        "Check first aid kit",
        "Verify fire extinguisher",
        "Inspect safety triangles",
        "Test horn functionality"
      ]
    };

    return (itemsMap[type] || []).map((item, index) => ({
      id: `${type}-${index}`,
      item,
      isCompleted: false,
    }));
  };

  const handleChecklistTypeChange = (type: string) => {
    setChecklistType(type);
    setItems(getDefaultItems(type));
  };

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isCompleted: !item.isCompleted }
        : item
    ));
  };

  const handleCreateChecklist = () => {
    if (!checklistType) {
      toast({
        title: "Error",
        description: "Please select a checklist type",
        variant: "destructive",
      });
      return;
    }

    const data: InsertDriverChecklist = {
      type: checklistType,
      status: "pending",
      items: items.map(item => ({
        item: item.item,
        isCompleted: item.isCompleted,
        notes: item.notes
      })),
    };

    createChecklistMutation.mutate(data);
  };

  const handleCompleteChecklist = (checklistId: string) => {
    updateChecklistMutation.mutate({
      id: checklistId,
      updates: { status: "completed" }
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "in_progress": { color: "bg-yellow-500", label: "In Progress", icon: Clock },
      "completed": { color: "bg-green-500", label: "Completed", icon: Check },
      "cancelled": { color: "bg-red-500", label: "Cancelled", icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_progress;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create New Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="checklist-type">Checklist Type</Label>
            <Select value={checklistType} onValueChange={handleChecklistTypeChange}>
              <SelectTrigger data-testid="select-checklist-type">
                <SelectValue placeholder="Select checklist type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre-trip">Pre-Trip Inspection</SelectItem>
                <SelectItem value="post-trip">Post-Trip Inspection</SelectItem>
                <SelectItem value="maintenance">Maintenance Check</SelectItem>
                <SelectItem value="safety">Safety Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Checklist Items</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleItem(item.id)}
                      data-testid={`checkbox-${item.id}`}
                    />
                    <Label
                      htmlFor={item.id}
                      className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''}`}
                    >
                      {item.item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleCreateChecklist}
            disabled={!checklistType || createChecklistMutation.isPending}
            className="w-full"
            data-testid="button-create-checklist"
          >
            {createChecklistMutation.isPending ? "Creating..." : "Create Checklist"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Checklists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Checklists
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checklistsLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (checklists || []).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No checklists found. Create your first checklist above!
            </div>
          ) : (
            <div className="space-y-3">
              {(checklists || []).slice(0, 5).map((checklist: any) => (
                <div key={checklist.id} className="border rounded-lg p-4" data-testid={`checklist-${checklist.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium capitalize">
                        {checklist.type.replace('-', ' ')} Checklist
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(checklist.createdAt).toLocaleDateString()} at{" "}
                        {new Date(checklist.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(checklist.status)}
                      {checklist.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteChecklist(checklist.id)}
                          disabled={updateChecklistMutation.isPending}
                          data-testid={`button-complete-${checklist.id}`}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {checklist.items && checklist.items.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Completed: {checklist.items.filter((item: any) => item.isCompleted).length} / {checklist.items.length} items
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}