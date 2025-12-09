import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ExternalLink } from "lucide-react";

interface Contact {
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
}

export const SendEmailModal = ({ open, onOpenChange, contact }: SendEmailModalProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setSelectedTemplate("");
      setSubject("");
      setBody("");
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, body')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const replaceVariables = (text: string, contactData: Contact | null) => {
    if (!contactData) return text;
    
    return text
      .replace(/\{\{contact_name\}\}/g, contactData.contact_name || '')
      .replace(/\{\{company_name\}\}/g, contactData.company_name || '')
      .replace(/\{\{position\}\}/g, contactData.position || '')
      .replace(/\{\{email\}\}/g, contactData.email || '');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId === "none") {
      setSubject("");
      setBody("");
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(replaceVariables(template.subject, contact));
      setBody(replaceVariables(template.body, contact));
    }
  };

  const handleSendEmail = () => {
    if (!contact?.email) {
      toast({
        title: "No email address",
        description: "This contact doesn't have an email address",
        variant: "destructive",
      });
      return;
    }

    // Construct mailto link
    const mailtoParams = new URLSearchParams();
    if (subject) mailtoParams.set('subject', subject);
    if (body) mailtoParams.set('body', body);
    
    const mailtoLink = `mailto:${contact.email}?${mailtoParams.toString()}`;
    
    // Open in new window/tab
    window.open(mailtoLink, '_blank');
    
    toast({
      title: "Email Client Opened",
      description: "Your default email client should open with the pre-filled template",
    });
    
    onOpenChange(false);
  };

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to {contact.contact_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">To:</Label>
            <p className="font-medium">{contact.email || "No email address"}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No templates available. Create templates in Settings → Email Templates.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email message..."
              rows={8}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={!contact?.email}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Email Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
