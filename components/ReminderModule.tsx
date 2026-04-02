
import React, { useState } from 'react';
import { ProcedureType, CarePlan, ReminderItem } from '../types';
import { generateRecoveryPlan } from '../services/geminiService';
import { 
  Calendar, Clock, CheckCircle, AlertCircle, ArrowRight, Loader2, 
  Phone, Send, Download, MessageSquare, Sun, Moon, CloudSun, User, Sparkles, ChevronLeft, Bell 
} from 'lucide-react';

const TIME_MAP: Record<string, string> = {
  'Morning': '早上',
  'Afternoon': '下午',
  'Evening': '晚上',
  'Anytime': '全天'
};

const TIME_ICON_MAP: Record<string, React.ReactNode> = {
  'Morning': <Sun className="w-5 h-5 text-orange-500" />,
  'Afternoon': <CloudSun className="w-5 h-5 text-yellow-500" />,
  'Evening': <Moon className="w-5 h-5 text-indigo-500" />,
  'Anytime': <Clock className="w-5 h-5 text-tooth-dark" />
};

export const ReminderModule: React.FC = () => {
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureType>(ProcedureType.TOOTH_EXTRACTION);
  const [patientName, setPatientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [age, setAge] = useState<number>(7);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);

  const handleGeneratePlan = async () => {
    if (!patientName || !contactInfo) return;
    
    setStep('loading');
    const reminders = await generateRecoveryPlan(selectedProcedure, age);
    
    const plan: CarePlan = {
      procedureName: selectedProcedure,
      patientName: patientName,
      contactInfo: contactInfo,
      // Use ISO string for reliable date parsing later
      generatedAt: new Date().toISOString(),
      reminders: reminders.sort((a, b) => a.dayOffset - b.dayOffset)
    };

    setCarePlan(plan);
    setStep('result');
  };

  const handleReset = () => {
    setStep('input');
    setCarePlan(null);
    setPatientName('');
    setContactInfo('');
  };

  // Generate .ics calendar file for real phone notifications
  const downloadCalendarFile = () => {
    if (!carePlan) return;

    const events = carePlan.reminders.map(reminder => {
      // Calculate event date based on generatedAt + dayOffset
      const startDate = new Date(carePlan.generatedAt);
      startDate.setDate(startDate.getDate() + reminder.dayOffset);
      
      // Set approximate time based on TimeOfDay
      let hour = 9; // Morning default
      if (reminder.timeOfDay === 'Afternoon') hour = 14;
      if (reminder.timeOfDay === 'Evening') hour = 19;
      startDate.setHours(hour, 0, 0);
      
      // End time (1 hour later)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Format date for ICS (YYYYMMDDTHHmmSSZ)
      const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Nina医生提醒: ${carePlan.patientName} - ${reminder.action.substring(0, 15)}...
DESCRIPTION:${reminder.action} (重要程度: ${reminder.importance})
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:术后护理提醒
END:VALARM
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nina Doctor//Dental Care Plan//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${carePlan.patientName}_术后护理计划.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open native SMS app with pre-filled message
  const handleSendSMS = () => {
    if (!carePlan) return;
    
    // Create a concise summary for SMS (SMS has char limits)
    const summary = carePlan.reminders.slice(0, 3).map(r => 
      `第${r.dayOffset}天: ${r.action}`
    ).join('\n');
    
    const message = `【Nina医生】${carePlan.patientName}的${carePlan.procedureName}术后护理提醒：\n${summary}\n...\n(请添加日历查看完整14天计划)`;
    
    // Use sms: protocol
    window.location.href = `sms:${carePlan.contactInfo}?&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-full w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center">
      
      {/* Header Section */}
      <div className="text-center mb-10 max-w-2xl mx-auto animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
           <Bell className="w-8 h-8 text-tooth-dark fill-current opacity-80" />
        </div>
        <h2 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">自适应护理提醒</h2>
        <p className="text-lg text-slate-500 font-medium">
          基于治疗项目，为孩子定制 <span className="text-tooth-dark">14天智能恢复计划</span>
        </p>
      </div>

      {/* Main Card Container */}
      <div className="w-full bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-tooth-blue/30 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-gum-pink/20 to-transparent rounded-tr-full pointer-events-none" />

        {step === 'input' && (
          <div className="p-8 md:p-12 max-w-3xl mx-auto animate-fade-in relative z-10">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Name */}
                <div className="group">
                  <label className="block text-sm font-bold text-slate-600 mb-2 pl-1 uppercase tracking-wider">患者姓名</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="例如：乐乐"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pl-12 focus:ring-4 focus:ring-tooth-dark/20 focus:border-tooth-dark outline-none transition-all shadow-sm group-hover:shadow-md text-lg"
                    />
                    <User className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="group">
                  <label className="block text-sm font-bold text-slate-600 mb-2 pl-1 uppercase tracking-wider">联系方式</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="家长手机号码"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pl-12 focus:ring-4 focus:ring-tooth-dark/20 focus:border-tooth-dark outline-none transition-all shadow-sm group-hover:shadow-md text-lg"
                    />
                    <Phone className="w-6 h-6 text-slate-400 absolute left-4 top-4" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Age */}
                <div className="group">
                  <label className="block text-sm font-bold text-slate-600 mb-2 pl-1 uppercase tracking-wider">年龄</label>
                  <input 
                    type="number" 
                    value={age}
                    min={1}
                    max={18}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-tooth-dark/20 focus:border-tooth-dark outline-none transition-all shadow-sm group-hover:shadow-md text-lg text-center font-mono"
                  />
                </div>

                {/* Procedure */}
                <div className="md:col-span-2 group">
                  <label className="block text-sm font-bold text-slate-600 mb-2 pl-1 uppercase tracking-wider">本次治疗项目</label>
                  <div className="relative">
                    <select 
                      value={selectedProcedure}
                      onChange={(e) => setSelectedProcedure(e.target.value as ProcedureType)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pr-10 focus:ring-4 focus:ring-tooth-dark/20 focus:border-tooth-dark outline-none appearance-none transition-all shadow-sm group-hover:shadow-md text-lg cursor-pointer"
                    >
                      {Object.values(ProcedureType).map((proc) => (
                        <option key={proc} value={proc}>{proc}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-5 pointer-events-none">
                       <ArrowRight className="w-5 h-5 text-slate-400 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGeneratePlan}
                  disabled={!patientName || !contactInfo}
                  className="w-full bg-gradient-to-r from-tooth-dark to-cyan-500 text-white font-bold text-xl py-5 rounded-2xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  生成专属护理时间表
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-slate-100 border-t-tooth-dark rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-tooth-dark animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nina医生正在思考...</h3>
            <p className="text-slate-500">正在为 <span className="font-bold text-tooth-dark">{patientName}</span> 量身定制 {age} 岁的术后方案</p>
          </div>
        )}

        {step === 'result' && carePlan && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Result Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20">
              <div className="flex items-center gap-4">
                 <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                    <CheckCircle className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">{carePlan.procedureName}</h2>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                       <span>患者: {carePlan.patientName}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span>{carePlan.contactInfo}</span>
                    </p>
                 </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                 <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  返回
                </button>
                <button 
                  onClick={downloadCalendarFile}
                  className="flex-1 md:flex-none bg-tooth-dark text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-cyan-600 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  保存日历
                </button>
                 <button 
                  onClick={handleSendSMS}
                  className="flex-1 md:flex-none bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  短信推送
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="p-6 md:p-12 bg-slate-50/50">
               <div className="max-w-4xl mx-auto relative">
                 {/* Timeline Line */}
                 <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-tooth-dark via-slate-300 to-transparent md:-translate-x-1/2"></div>
                 
                 <div className="space-y-12">
                    {carePlan.reminders.map((reminder, idx) => (
                      <div key={idx} className={`relative flex flex-col md:flex-row gap-6 items-center group ${
                        idx % 2 === 0 ? 'md:flex-row-reverse' : ''
                      }`}>
                         
                         {/* Date Marker (Center) */}
                         <div className="absolute left-8 md:left-1/2 w-16 h-8 md:w-12 md:h-12 bg-white border-4 border-tooth-blue rounded-full shadow-lg flex items-center justify-center z-10 md:-translate-x-1/2 -translate-x-1/2 transform transition-transform group-hover:scale-110">
                            <span className="text-xs md:text-sm font-bold text-tooth-dark">Day {reminder.dayOffset}</span>
                         </div>

                         {/* Empty Space for layout balance */}
                         <div className="flex-1 hidden md:block"></div>

                         {/* Content Card */}
                         <div className={`flex-1 w-full pl-16 md:pl-0 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                           <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
                             reminder.importance === 'High' ? 'ring-2 ring-red-100' : ''
                           }`}>
                              {/* Decorative bg icon */}
                              <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12">
                                 {TIME_ICON_MAP[reminder.timeOfDay]}
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                      {TIME_ICON_MAP[reminder.timeOfDay]}
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                      {TIME_MAP[reminder.timeOfDay]}
                                    </span>
                                 </div>
                                 {reminder.importance === 'High' && (
                                   <span className="bg-red-50 text-red-500 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                     <AlertCircle className="w-3 h-3" />
                                     重点关注
                                   </span>
                                 )}
                              </div>
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {reminder.action}
                              </p>
                           </div>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="text-center mt-12 pb-8">
                    <p className="text-slate-400 text-sm">
                      ✨ 祝 {carePlan.patientName} 早日康复，笑容常在！ ✨
                    </p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
