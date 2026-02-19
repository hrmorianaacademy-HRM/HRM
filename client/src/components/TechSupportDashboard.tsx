import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import * as ExcelJS from "exceljs";
import { useState } from "react";
import {
    Users,
    BookMarked,
    History,
    Download,
    Bell,
    Layout,
    CheckCircle,
    Clock,
    Calendar,
    Filter,
    FileSpreadsheet,
    X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from "wouter";
import { KathaipomFeed } from "@/components/KathaipomFeed";
import { MessageSquare as MessageSquareIcon } from "lucide-react";

interface TechSupportMetrics {
    totalClasses: number;
    totalStudents: number;
    recentRecords: {
        studentName: string;
        className: string;
        date: string;
        status: string;
        markedAt: string;
    }[];
}

export default function TechSupportDashboard({ userDisplayName }: { userDisplayName: string }) {
    const { data: metrics, isLoading } = useQuery<TechSupportMetrics>({
        queryKey: ["/api/tech-support/dashboard"],
    });

    const { toast } = useToast();

    const notifyMutation = useMutation({
        mutationFn: async (data: { classId: string; subject: string; message: string }) => {
            console.log('[notifyMutation] Triggering notification API...', data);
            const response = await apiRequest("POST", "/api/tech-support/notify-students", data);
            return await response.json();
        },
        onSuccess: (data) => {
            console.log('[notifyMutation] Success:', data);
            toast({
                title: "Success",
                description: data.message || "Absent students notified successfully",
            });
        },
        onError: (error: any) => {
            console.error('[notifyMutation] Error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to notify students",
                variant: "destructive",
            });
        },
    });

    // Export modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    // Notification modal state
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyClassId, setNotifyClassId] = useState<string>("");
    const [notifySubject, setNotifySubject] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");

    // Fetch classes for dropdown
    const { data: classes } = useQuery<any[]>({
        queryKey: ["/api/classes"],
    });

    // Fetch selected class details, students, attendance, and marks
    const performExport = async () => {
        if (!selectedClassId) {
            toast({
                title: "Select a Class",
                description: "Please select a class to export",
                variant: "destructive",
            });
            return;
        }

        setIsExporting(true);
        try {
            // Fetch class info
            const classRes = await fetch(`/api/classes/${selectedClassId}`, { credentials: 'include' });
            const classData = await classRes.json();

            // Fetch students
            const studentsRes = await fetch(`/api/classes/${selectedClassId}/student-mappings`, { credentials: 'include' });
            const students = await studentsRes.json();

            // Fetch marks
            const marksRes = await fetch(`/api/classes/${selectedClassId}/marks`, { credentials: 'include' });
            const marks = await marksRes.json();

            // Fetch attendance
            const attendanceRes = await fetch(`/api/classes/${selectedClassId}/attendance`, { credentials: 'include' });
            const attendance = await attendanceRes.json();

            if (!students || students.length === 0) {
                toast({
                    title: "No Students",
                    description: "No students found in this class",
                    variant: "destructive",
                });
                setIsExporting(false);
                return;
            }

            // Get unique dates from attendance, filtered by date range if specified
            let attendanceDates: string[] = Array.from(new Set(attendance.map((a: any) => a.date))).sort() as string[];
            if (fromDate) {
                attendanceDates = attendanceDates.filter((d: string) => d >= fromDate);
            }
            if (toDate) {
                attendanceDates = attendanceDates.filter((d: string) => d <= toDate);
            }

            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`${classData?.name || 'Class'} Attendance`);

            // Headers definition
            const headers = [
                "S.No", "Student ID", "Student Name", "Email",
                ...(attendanceDates.length > 0 ? attendanceDates : ["Date"]),
                "Total Present", "Total Absent", "Total Late", "Attendance %",
                "Assessment 1", "Assessment 2", "Task", "Project", "Final Validation", "Total Marks"
            ];

            // 1. Setup Header Row
            const headerRow = worksheet.getRow(1);
            headerRow.values = headers;
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0070C0' } // Blue background
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // 2. Meta Rows
            worksheet.addRow([`Class:`, classData?.name || "N/A", classData?.subject || ""]);
            worksheet.addRow([`Teacher:`, userDisplayName]);
            worksheet.addRow([`Export Date:`, format(new Date(), 'MM/dd/yyyy hh:mm a')]);
            worksheet.addRow([]); // Empty row

            // Style meta labels
            [2, 3, 4].forEach(rowNum => {
                const row = worksheet.getRow(rowNum);
                const cell = row.getCell(1);
                cell.font = { bold: true };
            });

            // 3. Student Data Rows
            const getAttendanceStats = (leadId: number) => {
                const studentAtt = attendance.filter((a: any) => a.leadId === leadId);
                const present = studentAtt.filter((a: any) => a.status === 'Present').length;
                const absent = studentAtt.filter((a: any) => a.status === 'Absent').length;
                const late = studentAtt.filter((a: any) => a.status === 'Late').length;
                const total = studentAtt.length;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                return { present, absent, late, percentage };
            };

            students.forEach((student: any, index: number) => {
                const mark = marks.find((m: any) => m.leadId === student.id) || {};
                const stats = getAttendanceStats(student.id);

                // Get attendance status for each date
                const dateStatuses = attendanceDates.map((date: string) => {
                    const att = attendance.find((a: any) => a.leadId === student.id && a.date === date);
                    return att?.status || "";
                });

                const rowValues = [
                    index + 1,
                    student.studentId || "PENDING",
                    student.name,
                    student.email || "",
                    ...dateStatuses,
                    stats.present,
                    stats.absent,
                    stats.late,
                    `${stats.percentage}%`,
                    mark.assessment1 || 0,
                    mark.assessment2 || 0,
                    mark.task || 0,
                    mark.project || 0,
                    mark.finalValidation || 0,
                    mark.total || 0
                ];

                const row = worksheet.addRow(rowValues);

                // Style the row cells
                row.eachCell((cell, colNumber) => {
                    const value = cell.value?.toString();

                    // Attendance status styling
                    if (value === 'Present') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Green
                        cell.font = { color: { argb: 'FF006100' } };
                    } else if (value === 'Absent') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Red
                        cell.font = { color: { argb: 'FF9C0006' } };
                    } else if (value === 'Late') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }; // Orange
                        cell.font = { color: { argb: 'FF9C5700' } };
                    }

                    // Total Marks and Attendance % styling
                    const headerName = headers[colNumber - 1];
                    if (headerName === 'Attendance %' || headerName === 'Total Marks') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }; // Green highlight
                    }
                });
            });

            // 4. Legend Section
            worksheet.addRow([]);
            worksheet.addRow([]);
            const legendRow = worksheet.addRow(["Legend:"]);
            legendRow.getCell(1).font = { bold: true };

            const legendColorsRow = worksheet.addRow(["Present", "Absent", "Late"]);

            const pCell = legendColorsRow.getCell(1);
            pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
            pCell.font = { color: { argb: 'FF006100' }, bold: true };

            const aCell = legendColorsRow.getCell(2);
            aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            aCell.font = { color: { argb: 'FF9C0006' }, bold: true };

            const lCell = legendColorsRow.getCell(3);
            lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
            lCell.font = { color: { argb: 'FF9C5700' }, bold: true };

            // 5. Adjust column widths
            worksheet.columns = [
                { width: 8 },   // S.No
                { width: 15 },  // Student ID
                { width: 25 },  // Student Name
                { width: 30 },  // Email
                ...attendanceDates.map(() => ({ width: 15 })), // Date columns
                { width: 12 },  // Total Present
                { width: 12 },  // Total Absent
                { width: 10 },  // Total Late
                { width: 15 },  // Attendance %
                { width: 12 },  // Assessment 1
                { width: 12 },  // Assessment 2
                { width: 10 },  // Task
                { width: 12 },  // Project
                { width: 15 },  // Final Validation
                { width: 12 },  // Total Marks
            ];

            // 6. Generate and download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            const fileName = `${classData?.name || 'Class'}_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
            anchor.download = fileName;
            anchor.click();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Exported!",
                description: `Data exported to ${fileName}`,
            });
            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: "Export Failed",
                description: "Failed to export data",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };


    // Open export modal
    const handleExportClick = () => {
        setShowExportModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Dashboard <span className="text-slate-500 font-medium text-2xl ml-2 tracking-tight">Welcome back, {userDisplayName}!</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content (Metrics, Actions, Tables) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Total Classes - Blue */}
                        <Card className="bg-blue-600 text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Layout className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.totalClasses || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Total Classes</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Students - Cyan */}
                        <Card className="bg-[#00CFE8] text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Users className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.totalStudents || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Total Students</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Records - Green */}
                        <Card className="bg-[#28C76F] text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <CheckCircle className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.recentRecords.length || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Recent Records</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <Link href="/classes">
                                <div className="group cursor-pointer">
                                    <div className="h-28 flex flex-col items-center justify-center border-2 border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-4 transition-all group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 group-hover:shadow-lg">
                                        <BookMarked className="h-8 w-8 text-blue-500 mb-2" />
                                        <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-widest text-center">Manage Classes</span>
                                    </div>
                                </div>
                            </Link>

                            <div className="group cursor-pointer">
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10 rounded-2xl p-4 transition-all group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/20 group-hover:shadow-lg">
                                    <History className="h-8 w-8 text-cyan-500 mb-2" />
                                    <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase text-[10px] tracking-widest text-center">View History</span>
                                </div>
                            </div>

                            <div className="group cursor-pointer" onClick={handleExportClick}>
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-green-400 bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-4 transition-all group-hover:bg-green-100 dark:group-hover:bg-green-900/20 group-hover:shadow-lg">
                                    <Download className="h-8 w-8 text-green-500 mb-2" />
                                    <span className="text-green-600 dark:text-green-400 font-bold uppercase text-[10px] tracking-widest text-center">Export Data</span>
                                </div>
                            </div>

                            <div
                                className={`group cursor-pointer ${notifyMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !notifyMutation.isPending && setShowNotifyModal(true)}
                            >
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl p-4 transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900/20 hover:shadow-lg">
                                    {notifyMutation.isPending ? (
                                        <Loader2 className="h-8 w-8 text-yellow-500 mb-2 animate-spin" />
                                    ) : (
                                        <Bell className="h-8 w-8 text-yellow-500 mb-2" />
                                    )}
                                    <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase text-[10px] tracking-widest text-center">Notify Students</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Records Table */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Recent Attendance Records</h2>
                        </div>
                        <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Class</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {metrics?.recentRecords.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">{record.studentName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs inline-block">
                                                        {record.className}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                                    {format(new Date(record.date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${record.status === 'Present'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-500 text-xs font-medium">
                                                    {format(new Date(record.markedAt), 'MMM dd, yyyy h:mm a')}
                                                </td>
                                            </tr>
                                        ))}
                                        {metrics?.recentRecords.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                    No recent records found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Team Feed */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center gap-2 p-1">
                            <MessageSquareIcon className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Team Feed</h2>
                        </div>
                        <Card className="shadow-green-lg hover:shadow-green-bright transition-shadow duration-300 border border-border overflow-hidden rounded-2xl bg-zinc-950">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-920 dark:to-purple-920 pb-4 border-b">
                                <CardTitle className="text-xl font-bold dark:text-white">
                                    Kathaipom
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 h-[800px] overflow-hidden">
                                <KathaipomFeed />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            Export Attendance & Marks
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Class Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Select Class <span className="text-red-500">*</span>
                            </label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map((cls: any) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name} {cls.subject ? `(${cls.subject})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Filters */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    From Date (Optional)
                                </label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    To Date (Optional)
                                </label>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Leave dates empty to include all attendance records</p>

                        {/* Export Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={performExport}
                                disabled={!selectedClassId || isExporting}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowExportModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Notification Modal */}
            <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-yellow-600" />
                            Send Notification to Students
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Subject/Class</label>
                            <Select value={notifyClassId} onValueChange={setNotifyClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Select a class --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map((cls: any) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Subject</label>
                            <Input
                                placeholder="Enter subject"
                                value={notifySubject}
                                onChange={(e) => setNotifySubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Description</label>
                            <Textarea
                                placeholder="Enter your message to students..."
                                className="min-h-[120px]"
                                value={notifyMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotifyMessage(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowNotifyModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
                            disabled={notifyMutation.isPending || !notifyClassId || !notifySubject || !notifyMessage}
                            onClick={() => {
                                notifyMutation.mutate({
                                    classId: notifyClassId,
                                    subject: notifySubject,
                                    message: notifyMessage
                                }, {
                                    onSuccess: () => setShowNotifyModal(false)
                                });
                            }}
                        >
                            {notifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                            Send Notification
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
