"use client";

import React, { useState, useEffect, useRef } from "react";

// Types
interface KeyValueDetail {
  label: string;
  value: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface DocumentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "analyzing" | "ready" | "error";
  uploadProgress?: number;
  uploadedAt: string;
  riskRating: "low" | "medium" | "high";
  riskScore: number; // 0 to 100
  documentContent: string; // Document context for fallback/RAG representation
  fileObject?: File; // Store actual binary File object for route parsing
  metadata: {
    title: string;
    issuerOrParties: string;
    date: string;
    additionalInfo: string;
    details: KeyValueDetail[];
  };
  checklist: ChecklistItem[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

// Initial Mock Document Context Contents
const ANNUAL_REPORT_CONTENT = `ACME CORPORATION INC. - ANNUAL REPORT FY2025
Summary of Operations:
Net revenue for the fiscal year ended December 31, 2025 was $342.8 million, showing an 8.4% increase compared to $316.2 million in FY2024.
Net Income: The consolidated net income stood at $42.5 million, up 12% year-over-year.
Operating margins reached 22.6%, an increase from 21.1% in FY2024, primarily driven by reduced data center operating expenses and automated server provisioning.
Independent Auditor: Deloitte & Touche LLP. The auditor issued an Unqualified (clean) opinion. No material weaknesses were reported in internal financial controls.
Jurisdiction: Delaware, United States.
Governance: The Board of Directors approved the FY2025 financial disclosures on March 14, 2026.`;

const SERVICE_AGREEMENT_CONTENT = `MASTER SERVICES AGREEMENT (MSA)
This Master Services Agreement is entered into on November 15, 2025 (the "Effective Date") by and between Global Tech Solutions ("Provider") and Apex Retail Inc. ("Client").
Uptime SLA: Provider guarantees a 99.9% monthly uptime SLA. In the event uptime falls below this threshold, Client is eligible for service credits up to a maximum of 25% of monthly fees.
Liability Limitation: Except for breaches of confidentiality or intellectual property rights, each party's aggregate liability under this agreement shall be capped at 1.5x the total fees paid by Client in the 12 months preceding the claim.
Payment Terms: All invoices shall be paid Net 45 Days from receipt of invoice. Late payments shall accrue interest at 1.5% per month.
Termination: Either party may terminate this agreement for convenience by providing 90 days prior written notice.
Governing Law: This agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to conflict of law principles. Any dispute shall be arbitrated in New York County, NY.`;

const GDPR_POLICY_CONTENT = `DATASPHERE SYSTEMS LTD - PRIVACY AND DATA PROTECTION POLICY
Effective: May 2026
This policy governs data controller operations at DataSphere Systems Ltd.
Data Processing and Storage: Customer personal data is stored in Amazon Web Services (AWS) data centers located within the European Union, specifically in Frankfurt (eu-central-1) and Dublin (eu-west-1).
Breach Notification: In compliance with GDPR Article 33, DataSphere Systems Ltd shall notify the relevant supervisory authority of a data breach within 72 hours of becoming aware of the incident.
Data Protection Officer: A DPO has been formally appointed and can be reached at dpo@datasphere.io.
Data Transfers: Cross-border transfers are conducted under the EU-US Data Privacy Framework. In case of invalidation, Standard Contractual Clauses (SCCs) are incorporated by reference.
CPRA Rights: Includes data erasure (Right to be Forgotten) and consumer data access, compliant with California Consumer Privacy Act (CCPA/CPRA). Data removal requests are handled within 30 days.`;

// Initial Mock Documents Data
const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    name: "annual_report_2025.pdf",
    size: "4.2 MB",
    type: "pdf",
    status: "ready",
    uploadedAt: "2026-06-12",
    riskRating: "low",
    riskScore: 15,
    documentContent: ANNUAL_REPORT_CONTENT,
    metadata: {
      title: "2025 Annual Financial Report",
      issuerOrParties: "Acme Corporation Inc.",
      date: "FY 2025 (Ended Dec 31, 2025)",
      additionalInfo: "Audited financial statements and regulatory disclosures.",
      details: [
        { label: "Entity Type", value: "Public Corporation (SEC)" },
        { label: "Net Revenue", value: "$342.8M (+8.4% YoY)" },
        { label: "Operating Margin", value: "22.6%" },
        { label: "Auditor Opinion", value: "Unqualified / Clean" },
        { label: "Jurisdiction", value: "Delaware, US" }
      ]
    },
    checklist: [
      { id: "c1-1", text: "Validate Consolidated Balance Sheets", completed: true },
      { id: "c1-2", text: "Verify Year-over-Year (YoY) revenue calculations", completed: true },
      { id: "c1-3", text: "Audit notes on supply chain liabilities", completed: false },
      { id: "c1-4", text: "Review governance and board approvals", completed: false }
    ]
  },
  {
    id: "doc-2",
    name: "service_agreement_vendor.docx",
    size: "1.8 MB",
    type: "docx",
    status: "ready",
    uploadedAt: "2026-06-13",
    riskRating: "medium",
    riskScore: 48,
    documentContent: SERVICE_AGREEMENT_CONTENT,
    metadata: {
      title: "Master Services Agreement (MSA)",
      issuerOrParties: "Global Tech Solutions & Apex Retail Inc.",
      date: "Effective Nov 15, 2025",
      additionalInfo: "IT service provisioning, uptime SLAs, and liability frameworks.",
      details: [
        { label: "Contract Type", value: "Master Services Agreement" },
        { label: "SLA Commitment", value: "99.9% Uptime Guarantee" },
        { label: "Liability Cap", value: "1.5x total fees paid" },
        { label: "Payment Terms", value: "Net 45 Days" },
        { label: "Termination Notice", value: "90-day written notice" }
      ]
    },
    checklist: [
      { id: "c2-1", text: "Confirm data protection & indemnity clauses", completed: true },
      { id: "c2-2", text: "Verify 1.5x liability cap matches compliance policy", completed: false },
      { id: "c2-3", text: "Check SLA service credit penalties structure", completed: false },
      { id: "c2-4", text: "Audit governing law provisions", completed: true }
    ]
  },
  {
    id: "doc-3",
    name: "gdpr_privacy_policy.pdf",
    size: "2.1 MB",
    type: "pdf",
    status: "ready",
    uploadedAt: "2026-06-10",
    riskRating: "high",
    riskScore: 82,
    documentContent: GDPR_POLICY_CONTENT,
    metadata: {
      title: "GDPR Compliance & Privacy Policy",
      issuerOrParties: "DataSphere Systems Ltd",
      date: "Updated May 2026",
      additionalInfo: "Customer data retention policies and subprocessor disclosures.",
      details: [
        { label: "Compliance Scope", value: "GDPR / CCPA / HIPAA" },
        { label: "Data Controller", value: "DataSphere Systems Ltd" },
        { label: "Storage Location", value: "EU Central (Frankfurt)" },
        { label: "Breach Window", value: "72 Hours Notification" },
        { label: "DPO Registered", value: "Yes (dpo@datasphere.io)" }
      ]
    },
    checklist: [
      { id: "c3-1", text: "Check Right to be Forgotten workflow compatibility", completed: true },
      { id: "c3-2", text: "Map automated data breach alerts trigger", completed: true },
      { id: "c3-3", text: "Verify subprocessor adequacy agreements", completed: false },
      { id: "c3-4", text: "Review cross-border transfer mechanisms", completed: false }
    ]
  }
];

// Initial Chat History
const INITIAL_CHAT_HISTORIES: Record<string, ChatMessage[]> = {
  "doc-1": [
    {
      id: "m1-1",
      sender: "agent",
      text: "Hello! I have completed analysis of **annual_report_2025.pdf**. I did not detect any major risk factors. The auditor has provided an unqualified opinion, and net revenues are up 8.4%. What would you like to drill into?",
      timestamp: "12:30 PM"
    },
    {
      id: "m1-2",
      sender: "user",
      text: "What was the operating margin of Acme Corporation?",
      timestamp: "12:31 PM"
    },
    {
      id: "m1-3",
      sender: "agent",
      text: "Based on Table 4.1 (Consolidated Operations Statement), the operating margin is **22.6%** for FY 2025. This represents a solid increase from the 21.1% recorded in FY 2024, driven primarily by optimized server infrastructure cost reductions.",
      timestamp: "12:31 PM"
    }
  ],
  "doc-2": [
    {
      id: "m2-1",
      sender: "agent",
      text: "I have parsed the **service_agreement_vendor.docx**. Please review the liability limits on the right side. The liability is capped at 1.5x of total fees paid, which is higher than our preferred 1.0x cap. How can I help you negotiate this contract?",
      timestamp: "11:45 AM"
    },
    {
      id: "m2-2",
      sender: "user",
      text: "What is the termination notice period?",
      timestamp: "11:46 AM"
    },
    {
      id: "m2-3",
      sender: "agent",
      text: "According to Section 11.3 (Term and Termination), either party can terminate this agreement for convenience by providing a minimum of **90 days written notice** prior to the end of the current renewal term. If notice is late, the contract automatically extends for another 1-year period.",
      timestamp: "11:46 AM"
    }
  ],
  "doc-3": [
    {
      id: "m3-1",
      sender: "agent",
      text: "Warning: **gdpr_privacy_policy.pdf** contains several high-risk indicators regarding international transfer agreements and subprocessor privacy protection gaps. Data is transferred outside the EEA without SCC documentation references. What would you like to review?",
      timestamp: "Yesterday"
    },
    {
      id: "m3-2",
      sender: "user",
      text: "Tell me about the breach notification clause.",
      timestamp: "Yesterday"
    },
    {
      id: "m3-3",
      sender: "agent",
      text: "Under Section 9.2 (Incident Management), the controller pledges to notify the supervisory authority of a data breach within **72 hours** after becoming aware of it. However, the clause lacks a clear timeframe for notifying the affected customers directly. This warrants a contract amendment recommendation.",
      timestamp: "Yesterday"
    }
  ]
};

export default function SmartDocumentWorkspace() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("doc-1");
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(INITIAL_CHAT_HISTORIES);
  const [inputText, setInputText] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"artifacts" | "checklist">("artifacts");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize documents only on client-side to ensure constructor operations execute safely
  useEffect(() => {
    const initializedDocs = INITIAL_DOCUMENTS.map((doc) => {
      let mockFile: File | undefined = undefined;
      if (doc.id === "doc-1") {
        mockFile = new File([ANNUAL_REPORT_CONTENT], "annual_report_2025.txt", { type: "text/plain" });
      } else if (doc.id === "doc-2") {
        mockFile = new File([SERVICE_AGREEMENT_CONTENT], "service_agreement_vendor.txt", { type: "text/plain" });
      } else if (doc.id === "doc-3") {
        mockFile = new File([GDPR_POLICY_CONTENT], "gdpr_privacy_policy.txt", { type: "text/plain" });
      }
      return {
        ...doc,
        fileObject: mockFile,
      };
    });
    setDocuments(initializedDocs);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, selectedDocId, isAgentTyping]);

  const activeDoc = documents.find((doc) => doc.id === selectedDocId) || documents[0];
  const activeChat = chatHistories[selectedDocId] || [];

  // Toggle checklist item completion
  const handleChecklistToggle = (docId: string, itemId: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            checklist: doc.checklist.map((item) =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          };
        }
        return doc;
      })
    );
  };

  // Add message to chat history
  const addChatMessage = (docId: string, sender: "user" | "agent", text: string) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      text,
      timestamp: timeString
    };

    setChatHistories((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), newMessage]
    }));
  };

  // Dynamic Metadata extraction using the new backend multipart route
  const extractDocumentMetadata = async (docId: string, fileObject: File, fileName: string) => {
    try {
      const formData = new FormData();
      formData.append(
        "message",
        `Extract the document parameters in a clean JSON object structure.
The JSON object must contain keys:
1. "title" (string, short title)
2. "parties" (string, issuer or parties)
3. "date" (string, document date)
4. "additionalInfo" (string, short context overview)
5. "details" (array of objects with "label" and "value" strings)
6. "checklist" (array of strings, 3-4 key actions required)
7. "riskScore" (number between 0 and 100)

Return ONLY the raw JSON block. Do not write any explanations before or after the JSON.`
      );
      formData.append("file", fileObject);

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Metadata extraction failed");

      const data = await response.json();
      let jsonText = data.text.trim();

      // Strip markdown code blocks
      if (jsonText.startsWith("```")) {
        const match = jsonText.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }

      const parsedData = JSON.parse(jsonText);

      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id === docId) {
            const newScore = typeof parsedData.riskScore === "number" ? parsedData.riskScore : doc.riskScore;
            return {
              ...doc,
              riskScore: newScore,
              riskRating: newScore > 75 ? "high" : newScore > 35 ? "medium" : "low",
              metadata: {
                title: parsedData.title || doc.metadata.title,
                issuerOrParties: parsedData.parties || doc.metadata.issuerOrParties,
                date: parsedData.date || doc.metadata.date,
                additionalInfo: parsedData.additionalInfo || doc.metadata.additionalInfo,
                details: Array.isArray(parsedData.details) ? parsedData.details : doc.metadata.details,
              },
              checklist: Array.isArray(parsedData.checklist)
                ? parsedData.checklist.map((c: string, idx: number) => ({
                    id: `c-${docId}-${idx}`,
                    text: c,
                    completed: false,
                  }))
                : doc.checklist,
            };
          }
          return doc;
        })
      );

      // Ingestion chat welcome notification updates
      setChatHistories((prev) => {
        const currentMessages = prev[docId] || [];
        const hasWelcome = currentMessages.some((m) => m.id === `msg-welcome-${docId}`);
        if (hasWelcome) {
          return prev;
        }
        const filtered = currentMessages.filter(
          (m) => !m.text.includes("Uploading") && !m.text.includes("Analyzing")
        );
        return {
          ...prev,
          [docId]: [
            ...filtered,
            {
              id: `msg-welcome-${docId}`,
              sender: "agent",
              text: `Ingested and analyzed **${fileName}** using live backend text extraction. I've extracted the metadata parameters and verification checklist on the right sidebar. What would you like to know about this document?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      });
    } catch (err) {
      console.error("Extraction failed, using fallback:", err);
      // Fallback if extraction fails
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id === docId) {
            return {
              ...doc,
              metadata: {
                title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                issuerOrParties: "External Ingestion System",
                date: new Date().toLocaleDateString(),
                additionalInfo: "Parsed document elements available.",
                details: [
                  { label: "Detected Format", value: doc.type.toUpperCase() },
                  { label: "File Size", value: doc.size },
                  { label: "Ingestion Scope", value: "Verification Complete" },
                ],
              },
              checklist: [
                { id: `c-${docId}-1`, text: "Review key document clauses", completed: false },
                { id: `c-${docId}-2`, text: "Validate governing jurisdiction", completed: false },
                { id: `c-${docId}-3`, text: "Check legal sign-off blocks", completed: false },
              ],
            };
          }
          return doc;
        })
      );

      setChatHistories((prev) => {
        const currentMessages = prev[docId] || [];
        const hasWelcome = currentMessages.some((m) => m.id === `msg-welcome-${docId}`);
        if (hasWelcome) {
          return prev;
        }
        const filtered = currentMessages.filter(
          (m) => !m.text.includes("Uploading") && !m.text.includes("Analyzing")
        );
        return {
          ...prev,
          [docId]: [
            ...filtered,
            {
              id: `msg-welcome-${docId}`,
              sender: "agent",
              text: `Ingested **${fileName}**. Fallback metadata is loaded. How can I assist you with this document?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      });
    }
  };

  // POST Request chat multipart form handler (synchronous JSON payload)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isAgentTyping) return;

    const query = inputText.trim();
    setInputText("");
    setErrorBanner(null);

    // 1. Immediately update UI with user's message
    addChatMessage(selectedDocId, "user", query);

    // Maintain skeleton indicator
    setIsAgentTyping(true);

    try {
      // 2. Prepare FormData payload
      const formData = new FormData();
      formData.append("message", query);
      if (activeDoc && activeDoc.fileObject) {
        formData.append("file", activeDoc.fileObject);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "An error occurred while communicating with the document agent.";
        try {
          const parsedErr = JSON.parse(errText);
          errMsg = parsedErr.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      // 3. Receive generated response as clean JSON
      const data = await response.json();
      setIsAgentTyping(false); // Turn off typing skeleton immediately on return

      if (data.error) {
        throw new Error(data.error);
      }

      const responseText = data.text || "No response generated by agent.";
      
      // Map result directly to message stream history
      addChatMessage(selectedDocId, "agent", responseText);

      // 4. Update the right-hand panel 'Parsed Document Summary' dynamically with real-time extracted metrics
      if (activeDoc && activeDoc.fileObject) {
        await extractDocumentMetadata(selectedDocId, activeDoc.fileObject, activeDoc.name);
      }

    } catch (err: any) {
      setIsAgentTyping(false);
      setErrorBanner(err?.message || "Internal Connection Failure. Check API key configurations.");
    }
  };

  // Trigger quick action buttons
  const handleChipClick = (chipText: string) => {
    setInputText(chipText);
    setTimeout(() => {
      handleSendMessage();
    }, 50);
  };

  // Ingest files & capture File object
  const processUploadedFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const fileId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const fileExtension = file.name.split(".").pop() || "pdf";
      const fileSizeString = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const newDoc: DocumentItem = {
        id: fileId,
        name: file.name,
        size: fileSizeString,
        type: fileExtension,
        status: "uploading",
        uploadProgress: 10,
        uploadedAt: new Date().toISOString().split("T")[0],
        riskRating: "low",
        riskScore: 20,
        documentContent: `Ingested local file ${file.name}. Raw extraction pending...`,
        fileObject: file, // Save the actual binary File object
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
          issuerOrParties: "Extracting...",
          date: "Extracting...",
          additionalInfo: "Uploading file content parameters...",
          details: [
            { label: "Detected Format", value: fileExtension.toUpperCase() },
            { label: "File Size", value: fileSizeString },
          ],
        },
        checklist: [{ id: `c-${fileId}-init`, text: "Extracting items...", completed: false }],
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(fileId);
      setLeftSidebarOpen(false);

      setChatHistories((prev) => ({
        ...prev,
        [fileId]: [
          {
            id: `msg-init-${fileId}`,
            sender: "agent",
            text: `Uploading **${file.name}**... Connecting to Agent Workspace...`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));

      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += 30;
        if (progress >= 100) {
          clearInterval(progressInterval);
          setDocuments((prevDocs) =>
            prevDocs.map((d) => (d.id === fileId ? { ...d, status: "analyzing", uploadProgress: 100 } : d))
          );

          setChatHistories((prev) => ({
            ...prev,
            [fileId]: [
              ...(prev[fileId] || []),
              {
                id: `msg-an-${fileId}`,
                sender: "agent",
                text: `Analyzing document structures, extracting vectors, and reading pages...`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          }));

          setTimeout(async () => {
            setDocuments((prevDocs) =>
              prevDocs.map((d) => (d.id === fileId ? { ...d, status: "ready" } : d))
            );

            // Execute backend extraction immediately using the uploaded file
            await extractDocumentMetadata(fileId, file, file.name);
          }, 1500);
        } else {
          setDocuments((prevDocs) =>
            prevDocs.map((d) => (d.id === fileId ? { ...d, uploadProgress: progress } : d))
          );
        }
      }, 300);
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  // Delete document handler
  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (documents.length <= 1) {
      alert("At least one document must remain in the workspace.");
      return;
    }

    const indexToDelete = documents.findIndex((d) => d.id === docId);
    const updatedDocs = documents.filter((d) => d.id !== docId);
    setDocuments(updatedDocs);

    if (selectedDocId === docId) {
      const fallbackIndex = indexToDelete > 0 ? indexToDelete - 1 : 0;
      setSelectedDocId(updatedDocs[fallbackIndex].id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b13] text-slate-400">
        <svg className="h-6 w-6 animate-spin text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Initializing Smart Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b13] text-slate-100 font-sans antialiased">
      {/* LEFT SIDEBAR: Document Upload Zone */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-900 bg-[#0B0F19] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-900 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">SmartRAG</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-400 font-medium">Workspace Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setLeftSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Left Sidebar Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 custom-scrollbar gap-5">
          {/* Section: Drag & Drop Ingestion Target */}
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ingest Document</h2>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-all duration-200 group ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/5 shadow-inner"
                  : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className={`mb-2 rounded-xl p-2.5 transition-colors ${
                isDragActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-900 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-950"
              }`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-300">Drag & drop document</span>
              <span className="mt-1 text-[10px] text-slate-500">Supports PDF, DOCX, TXT, MD</span>
            </div>
          </div>

          {/* Section: Uploaded Files List */}
          <div className="flex flex-1 flex-col">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Document Stream</h2>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                {documents.length} files
              </span>
            </div>

            <div className="space-y-2 flex-1">
              {documents.map((doc) => {
                const isActive = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setLeftSidebarOpen(false);
                    }}
                    className={`group relative flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? "bg-slate-900/80 border-slate-800 shadow-md ring-1 ring-slate-800"
                        : "bg-transparent border-transparent hover:bg-slate-900/30 hover:border-slate-900"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? "bg-indigo-950/80 text-indigo-400 border border-indigo-900" : "bg-slate-900 text-slate-400 border border-slate-900"
                    }`}>
                      {doc.type === "pdf" ? (
                        <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : doc.type === "docx" || doc.type === "doc" ? (
                        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 font-medium">{doc.size}</span>
                        <span className="text-[10px] text-slate-600 font-medium">•</span>
                        {doc.status === "uploading" && (
                          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 animate-pulse">
                            <span className="h-1 w-1 rounded-full bg-indigo-400"></span>
                            Uploading ({doc.uploadProgress}%)
                          </span>
                        )}
                        {doc.status === "analyzing" && (
                          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            Analyzing...
                          </span>
                        )}
                        {doc.status === "ready" && (
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                            doc.riskRating === "high" ? "text-rose-400" : doc.riskRating === "medium" ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              doc.riskRating === "high" ? "bg-rose-500" : doc.riskRating === "medium" ? "bg-amber-500" : "bg-emerald-500"
                            }`}></span>
                            Ready
                          </span>
                        )}
                        {doc.status === "error" && (
                          <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-rose-500"></span>
                            Error
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 text-slate-500 rounded p-1 transition-all hover:bg-slate-950"
                      title="Remove document"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER STAGE: Chat Stream Window */}
      <main className="flex flex-1 flex-col bg-[#090D16] relative border-r border-slate-900/60">
        
        {/* Error Dismissible Alert Banner */}
        {errorBanner && (
          <div className="bg-rose-950/80 border-b border-rose-900/50 text-rose-300 px-5 py-3 text-xs flex justify-between items-center backdrop-blur-sm z-50 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-semibold text-rose-200">Error Integration:</span>
              <span className="truncate max-w-[200px] sm:max-w-md">{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-slate-400 hover:text-white font-bold px-2 py-1 hover:bg-rose-900/30 rounded transition-all text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Mobile Top Navigation Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-[#0B0F19] px-4 lg:bg-transparent lg:border-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">
                  {activeDoc.type.toUpperCase()}
                </span>
                <span className="text-sm font-semibold truncate max-w-[140px] sm:max-w-xs text-white">
                  {activeDoc.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block lg:hidden">
                Risk Score: {activeDoc.riskScore}% ({activeDoc.riskRating.toUpperCase()})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Top bar on desktop */}
        <div className="hidden lg:flex h-16 items-center justify-between border-b border-slate-900/60 bg-[#0B0F19]/40 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-1.5 border border-slate-800/80">
              <span className={`h-2 w-2 rounded-full ${
                activeDoc.riskRating === "high" ? "bg-rose-500 animate-pulse" : activeDoc.riskRating === "medium" ? "bg-amber-500" : "bg-emerald-500"
              }`}></span>
              <span className="text-xs font-medium text-slate-300">
                {activeDoc.name}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-xs text-slate-500">
              Uploaded: <span className="text-slate-400 font-semibold">{activeDoc.uploadedAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Compliance Risk Score:</span>
            <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              activeDoc.riskRating === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : activeDoc.riskRating === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {activeDoc.riskScore}% Risk
            </div>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 custom-scrollbar space-y-4">
          {activeChat.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Initial Ingestion Stream</h3>
              <p className="text-xs text-slate-500 mt-1">
                The agent is ready to respond. Type your prompt below or execute a checklist query.
              </p>
            </div>
          ) : (
            activeChat.map((message) => {
              const isUser = message.sender === "user";
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      isUser 
                        ? "bg-slate-900 border border-slate-800 text-indigo-400" 
                        : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow shadow-indigo-500/10"
                    }`}>
                      {isUser ? "U" : (
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                        isUser
                          ? "bg-indigo-600 border-indigo-700/50 text-white rounded-tr-none shadow-indigo-600/10"
                          : "bg-slate-900/95 border-slate-800 text-slate-200 rounded-tl-none shadow-black/20"
                      }`}>
                        <div className="whitespace-pre-line">
                          {message.text.split("\n").map((line, i) => {
                            if (line.startsWith("- **")) {
                              const match = line.match(/- \*\*(.*?)\*\*:(.*)/);
                              if (match) {
                                return (
                                  <div key={i} className="pl-2.5 my-1.5 flex items-start gap-1.5">
                                    <span className="text-indigo-400 mt-1">•</span>
                                    <span>
                                      <strong className="text-slate-100">{match[1]}</strong>:
                                      <span className="text-slate-300">{match[2]}</span>
                                    </span>
                                  </div>
                                );
                              }
                            }
                            
                            let formattedLine: React.ReactNode = line;
                            if (line.includes("**")) {
                              const parts = line.split("**");
                              formattedLine = parts.map((part, idx) => 
                                idx % 2 === 1 ? (
                                  <strong key={idx} className="text-white font-semibold">{part}</strong>
                                ) : (
                                  <span key={idx}>{part}</span>
                                )
                              );
                            }
                            return <p key={i}>{formattedLine}</p>;
                          })}
                        </div>
                      </div>
                      
                      <span className={`text-[9px] text-slate-600 px-1 font-medium ${isUser ? "text-right" : "text-left"}`}>
                        {message.timestamp}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator Skeleton */}
          {isAgentTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%] flex-row">
                <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow shadow-indigo-500/10">
                  <svg className="h-4.5 w-4.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                
                <div className="flex flex-col gap-1 w-64 md:w-96">
                  <div className="rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-black/20">
                    <div className="h-3 bg-slate-800 rounded w-1/3 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-800/80 rounded animate-pulse"></div>
                      <div className="h-2 bg-slate-800/80 rounded w-5/6 animate-pulse"></div>
                      <div className="h-2 bg-slate-800/80 rounded w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-600 px-1 font-medium">Agent is parsing PDF/text content...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 flex flex-wrap gap-2 bg-[#090D16]/65 backdrop-blur-sm z-10 border-t border-slate-900/30">
          <button
            type="button"
            onClick={() => handleChipClick("Summarize Document")}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <span className="text-violet-400">✨</span> Summarize Document
          </button>
          <button
            type="button"
            onClick={() => handleChipClick("Verify Compliance Risks")}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <span className="text-rose-400">⚡</span> Compliance Risks
          </button>
          <button
            type="button"
            onClick={() => handleChipClick("Show Key Extractions")}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <span className="text-emerald-400">🔍</span> Key Extractions
          </button>
          <button
            type="button"
            onClick={() => handleChipClick("Checklist Task Report")}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <span className="text-indigo-400">📋</span> Checklist Status
          </button>
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="p-4 md:p-6 border-t border-slate-900 bg-[#0B0F19]">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-4 p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-900 transition-all"
              title="Attach document"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAgentTyping || activeDoc.status !== "ready"}
              placeholder={
                activeDoc.status !== "ready" 
                  ? "Analyzing document components. Input disabled..." 
                  : `Ask a question about ${activeDoc.name}...`
              }
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3.5 pl-12 pr-16 text-sm text-slate-200 placeholder-slate-500 shadow-inner focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                type="submit"
                disabled={!inputText.trim() || isAgentTyping || activeDoc.status !== "ready"}
                className={`flex h-9 w-9 items-center justify-center rounded-xl font-medium shadow-md transition-all ${
                  inputText.trim() && !isAgentTyping && activeDoc.status === "ready"
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white cursor-pointer shadow-indigo-600/10"
                    : "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800/80"
                }`}
              >
                {isAgentTyping ? (
                  <svg className="h-4 w-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Active Agent Artifacts */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-slate-900 bg-[#0B0F19] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          rightSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-900 px-5">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-white">Active Agent Artifacts</h2>
          </div>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-900 p-2 gap-1 bg-slate-950/20">
          <button
            onClick={() => setActiveRightTab("artifacts")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeRightTab === "artifacts"
                ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Metadata Extractions
          </button>
          <button
            onClick={() => setActiveRightTab("checklist")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeRightTab === "checklist"
                ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tasks Checklist
          </button>
        </div>

        {/* Scrollable Right Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
          
          {/* Section: Risk & Compliance gauge */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment</h3>
              <span className={`text-[10px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5 ${
                activeDoc.riskRating === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : activeDoc.riskRating === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {activeDoc.riskRating}
              </span>
            </div>

            {/* Glowing Compliance Progress Slider Gauge */}
            <div className="relative mt-3">
              <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden flex">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)] ${
                    activeDoc.riskRating === "high" 
                      ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                      : activeDoc.riskRating === "medium" 
                      ? "bg-gradient-to-r from-emerald-500 to-amber-500" 
                      : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  }`}
                  style={{ width: `${activeDoc.riskScore}%` }}
                ></div>
              </div>
              <div 
                className="absolute -top-1.5 transition-all duration-500 ease-out" 
                style={{ left: `calc(${activeDoc.riskScore}% - 6px)` }}
              >
                <div className="h-3 w-3 rounded-full border border-slate-950 bg-white pulse-border ring-2 ring-indigo-500"></div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Low Risk</span>
              <span className="text-slate-300 font-bold">{activeDoc.riskScore}% Compliance Deficit</span>
              <span>High Risk</span>
            </div>
            
            <p className="mt-3 text-[11px] leading-normal text-slate-400">
              {activeDoc.riskRating === "high" 
                ? "Warning: Major non-compliance flags active. Standard transfers are not backed up. Legal review is strongly recommended."
                : activeDoc.riskRating === "medium"
                ? "Notice: Liability provisions slightly out of guidelines. Mitigation recommendations compiled."
                : "Safe: Document matches core internal parameters. Standard operations proceed."}
            </p>
          </div>

          {activeRightTab === "artifacts" ? (
            /* Tab Content: Metadata Extractions */
            <div className="space-y-5">
              {/* Active Document Basic Details Card */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Parsed Document Summary</h3>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 space-y-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Document Title</span>
                    <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{activeDoc.metadata.title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Parties / Entity</span>
                    <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{activeDoc.metadata.issuerOrParties}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Time Context</span>
                    <span className="text-xs font-semibold text-slate-200 mt-0.5 block">{activeDoc.metadata.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Extraction Scope</span>
                    <span className="text-xs text-slate-400 mt-0.5 block leading-normal">{activeDoc.metadata.additionalInfo}</span>
                  </div>
                </div>
              </div>

              {/* Extraction Parameters Grid Table */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Extracted Parameter Matrix</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/30">
                  <table className="min-w-full divide-y divide-slate-900/50">
                    <tbody className="divide-y divide-slate-900/50">
                      {activeDoc.metadata.details.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20 transition-all">
                          <td className="px-4 py-2.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                            {detail.label}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-right text-slate-200">
                            {detail.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Tab Content: Checklist Panel */
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Action Verification Checklist</h3>
              <div className="rounded-2xl border border-slate-900 bg-slate-900/30 overflow-hidden divide-y divide-slate-900/60">
                {activeDoc.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleChecklistToggle(activeDoc.id, item.id)}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-900/20 cursor-pointer transition-colors group"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.completed ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white shadow shadow-emerald-500/10">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded border border-slate-700 bg-slate-950 group-hover:border-slate-500 transition-all"></div>
                      )}
                    </div>

                    <span className={`text-xs transition-colors ${
                      item.completed 
                        ? "text-slate-500 line-through font-medium" 
                        : "text-slate-300 group-hover:text-slate-100 font-medium"
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 px-1.5">
                <span>Completed verification:</span>
                <span className="font-bold text-slate-400">
                  {activeDoc.checklist.filter(c => c.completed).length} / {activeDoc.checklist.length} tasks
                </span>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* Global Overlay for toggled Mobile Sidebars */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-200"
        />
      )}
    </div>
  );
}
