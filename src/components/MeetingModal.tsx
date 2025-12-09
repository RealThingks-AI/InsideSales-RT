import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Loader2 } from "lucide-react";

interface Meeting {
  id: string;
  subject: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  join_url?: string | null;
  attendees?: unknown;
  lead_id?: string | null;
  contact_id?: string | null;
  status: string;
}

interface Lead {
  id: string;
  lead_name: string;
  email?: string;
}

interface Contact {
  id: string;
  contact_name: string;
  email?: string;
}

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  onSuccess: () => void;
}

export const MeetingModal = ({ open, onOpenChange, meeting, onSuccess }: MeetingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creatingTeamsMeeting, setCreatingTeamsMeeting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    start_time: "",
    end_time: "",
    join_url: "",
    lead_id: "",
    contact_id: "",
    status: "scheduled"
  });

  useEffect(() => {
    if (open) {
      fetchLeadsAndContacts();
      if (meeting) {
        setFormData({
          subject: meeting.subject || "",
          description: meeting.description || "",
          start_time: meeting.start_time ? meeting.start_time.slice(0, 16) : "",
          end_time: meeting.end_time ? meeting.end_time.slice(0, 16) : "",
          join_url: meeting.join_url || "",
          lead_id: meeting.lead_id || "",
          contact_id: meeting.contact_id || "",
          status: meeting.status || "scheduled"
        });
      } else {
        // Set default start time to next hour
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const end = new Date(now.getTime() + 60 * 60 * 1000);
        setFormData({
          subject: "",
          description: "",
          start_time: now.toISOString().slice(0, 16),
          end_time: end.toISOString().slice(0, 16),
          join_url: "",
          lead_id: "",
          contact_id: "",
          status: "scheduled"
        });
      }
    }
  }, [open, meeting]);

  const fetchLeadsAndContacts = async () => {
    try {
      const [leadsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('id, lead_name, email').order('lead_name'),
        supabase.from('contacts').select('id, contact_name, email').order('contact_name')
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (contactsRes.data) setContacts(contactsRes.data);
    } catch (error) {
      console.error('Error fetching leads/contacts:', error);
    }
  };

  const createTeamsMeeting = async () => {
    if (!formData.subject || !formData.start_time || !formData.end_time) {
      toast({
        title: "Missing fields",
        description: "Please fill in subject, start time and end time first",
        variant: "destructive",
      });
      return;
    }

    setCreatingTeamsMeeting(true);
    try {
      // Get attendees from selected lead/contact
      const attendees: { email: string; name: string }[] = [];
      
      if (formData.lead_id) {
        const lead = leads.find(l => l.id === formData.lead_id);
        if (lead?.email) {
          attendees.push({ email: lead.email, name: lead.lead_name });
        }
      }
      
      if (formData.contact_id) {
        const contact = contacts.find(c => c.id === formData.contact_id);
        if (contact?.email) {
          attendees.push({ email: contact.email, name: contact.contact_name });
        }
      }

      const { data, error } = await supabase.functions.invoke('create-teams-meeting', {
        body: {
          subject: formData.subject,
          attendees,
          startTime: formData.start_time,
          endTime: formData.end_time
        }
      });

      if (error) throw error;

      if (data?.meeting?.joinUrl) {
        setFormData(prev => ({ ...prev, join_url: data.meeting.joinUrl }));
        toast({
          title: "Teams Meeting Created",
          description: "Meeting link has been generated",
        });
      }
    } catch (error: any) {
      console.error('Error creating Teams meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Teams meeting",
        variant: "destructive",
      });
    } finally {
      setCreatingTeamsMeeting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.start_time || !formData.end_time) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const meetingData = {
        subject: formData.subject,
        description: formData.description || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        join_url: formData.join_url || null,
        lead_id: formData.lead_id || null,
        contact_id: formData.contact_id || null,
        status: formData.status,
        created_by: user?.id
      };

      if (meeting) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id);
        if (error) throw error;
        toast({ title: "Success", description: "Meeting updated successfully" });
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert([meetingData]);
        if (error) throw error;
        toast({ title: "Success", description: "Meeting created successfully" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "New Meeting"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Meeting subject"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_id">Link to Lead</Label>
            <Select
              value={formData.lead_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lead (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.lead_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_id">Link to Contact</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="join_url">Teams Meeting Link</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createTeamsMeeting}
                disabled={creatingTeamsMeeting}
                className="gap-2"
              >
                {creatingTeamsMeeting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                Create Teams Meeting
              </Button>
            </div>
            <Input
              id="join_url"
              value={formData.join_url}
              onChange={(e) => setFormData(prev => ({ ...prev, join_url: e.target.value }))}
              placeholder="https://teams.microsoft.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : meeting ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
