const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const moment = require('moment');
const db = require('../db');

class PDFGenerator {
  generateUserReport(responseData) {
    const doc = new jsPDF();
    const { response, answers } = responseData;
    
    // Title
    doc.setFontSize(20);
    doc.text('Solid Edge Success Criteria Checklist', 20, 30);
    
    // User info
    doc.setFontSize(12);
    doc.text(`Email: ${response.email}`, 20, 50);
    doc.text(`Language: ${response.language === 'EN' ? 'English' : 'Bahasa Indonesia'}`, 20, 65);
    doc.text(`Date: ${moment(response.timestamp).format('YYYY-MM-DD HH:mm:ss')}`, 20, 80);
    
    // Enhanced scoring summary
    const yesCount = answers.filter(a => a.answer === 'Yes').length;
    const noCount = answers.filter(a => a.answer === 'No').length;
    const naCount = answers.filter(a => a.answer === 'N/A').length;
    const totalAnswers = answers.length;
    const expectedQuestions = 19; // Each user answers 19 questions
    
    // Calculate percentages and completion
    const yesPercentage = totalAnswers > 0 ? Math.round((yesCount / totalAnswers) * 100) : 0;
    const noPercentage = totalAnswers > 0 ? Math.round((noCount / totalAnswers) * 100) : 0;
    const naPercentage = totalAnswers > 0 ? Math.round((naCount / totalAnswers) * 100) : 0;
    const completionRate = Math.round((totalAnswers / expectedQuestions) * 100);
    
    // Performance score (based on Yes answers)
    const performanceScore = totalAnswers > 0 ? Math.round((yesCount / totalAnswers) * 100) : 0;
    
    // Overall score summary box
    doc.setFontSize(14);
    doc.text('OVERALL SCORE SUMMARY', 20, 105);
    
    doc.setFontSize(11);
    doc.text(`Performance Score: ${performanceScore}% (${yesCount}/${totalAnswers} criteria met)`, 25, 120);
    doc.text(`Completion Rate: ${completionRate}% (${totalAnswers}/${expectedQuestions} questions answered)`, 25, 135);
    
    // Detailed breakdown
    doc.setFontSize(10);
    doc.text('Answer Distribution:', 25, 155);
    doc.text(`• Yes: ${yesCount} (${yesPercentage}%) - Criteria successfully met`, 30, 170);
    doc.text(`• No: ${noCount} (${noPercentage}%) - Criteria not met, requires attention`, 30, 185);
    doc.text(`• N/A: ${naCount} (${naPercentage}%) - Not applicable to current setup`, 30, 200);
    
    // Performance analysis
    let performanceText = '';
    if (performanceScore >= 90) performanceText = 'Excellent - Outstanding implementation!';
    else if (performanceScore >= 75) performanceText = 'Good - Well implemented with minor improvements needed';
    else if (performanceScore >= 60) performanceText = 'Average - Several areas need improvement';
    else performanceText = 'Needs Improvement - Significant gaps require attention';
    
    doc.text(`Performance Analysis: ${performanceText}`, 25, 220);
    
    // Answers table
    const tableData = answers.map(answer => [
      answer.area || '',
      answer.activity || '',
      answer.criteria || '',
      answer.answer || '',
      answer.remarks || ''
    ]);
    
    doc.autoTable({
      head: [['Area', 'Activity/Feature', 'Success Criteria', 'Answer', 'Remarks']],
      body: tableData,
      startY: 240,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { cellWidth: 50 }
      },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.text('Solid Edge Success Criteria Report', data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });
    
    return Buffer.from(doc.output('arraybuffer'));
  }



  async getUserAnswers(responseId) {
    try {
      const answers = await db.query(`
        SELECT a.*, q.area, q.activity, q.criteria 
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.response_id = ?
        ORDER BY q.sequence_order
      `, [responseId]);
      return answers || [];
    } catch (error) {
      console.error('Error fetching user answers:', error);
      return [];
    }
  }

  async generateConsolidatedReport(allResponses, questionStats) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Consolidated Success Criteria Report', 20, 30);
    
    // Date range and summary
    doc.setFontSize(12);
    doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 20, 50);
    doc.text(`Total Responses: ${allResponses.length}`, 20, 65);
    
    // Language breakdown
    const engCount = allResponses.filter(r => r.language === 'EN').length;
    const idCount = allResponses.filter(r => r.language === 'ID').length;
    doc.text(`English: ${engCount}, Bahasa Indonesia: ${idCount}`, 20, 80);
    
    // Calculate overall statistics
    let totalYes = 0, totalNo = 0, totalNA = 0, totalAnswers = 0;
    if (questionStats && questionStats.length > 0) {
      totalYes = questionStats.reduce((sum, stat) => sum + (parseInt(stat.yes_count) || 0), 0);
      totalNo = questionStats.reduce((sum, stat) => sum + (parseInt(stat.no_count) || 0), 0);
      totalNA = questionStats.reduce((sum, stat) => sum + (parseInt(stat.na_count) || 0), 0);
      totalAnswers = totalYes + totalNo + totalNA;
    }
    
    // Overall score summary
    if (totalAnswers > 0) {
      const yesPercentage = Math.round((totalYes / totalAnswers) * 100);
      const noPercentage = Math.round((totalNo / totalAnswers) * 100);
      const naPercentage = Math.round((totalNA / totalAnswers) * 100);
      const overallSuccessRate = yesPercentage;
      
      doc.setFontSize(14);
      doc.text('OVERALL SCORE SUMMARY', 20, 105);
      
      doc.setFontSize(11);
      doc.text(`Overall Success Rate: ${overallSuccessRate}% (${totalYes}/${totalAnswers} criteria met)`, 25, 120);
      doc.text(`Total Assessments: ${allResponses.length} users completed evaluations`, 25, 135);
      
      // Answer distribution summary
      doc.setFontSize(10);
      doc.text('Consolidated Answer Distribution:', 25, 155);
      doc.text(`• Yes: ${totalYes} (${yesPercentage}%) - Successfully implemented criteria`, 30, 170);
      doc.text(`• No: ${totalNo} (${noPercentage}%) - Areas requiring improvement`, 30, 185);
      doc.text(`• N/A: ${totalNA} (${naPercentage}%) - Not applicable across implementations`, 30, 200);
      
      // Organization performance level
      let orgPerformance = '';
      if (overallSuccessRate >= 90) orgPerformance = 'Excellent - Organization shows outstanding Solid Edge implementation';
      else if (overallSuccessRate >= 75) orgPerformance = 'Good - Strong implementation with minor optimization opportunities';
      else if (overallSuccessRate >= 60) orgPerformance = 'Average - Moderate implementation, focus on key improvement areas';
      else orgPerformance = 'Needs Attention - Significant implementation gaps require strategic focus';
      
      doc.text(`Organization Performance: ${orgPerformance}`, 25, 220);
    }
    
    // Question statistics table
    if (questionStats && questionStats.length > 0) {
      const statsData = questionStats.map(stat => [
        stat.area || '',
        stat.activity || '',
        stat.yes_count || 0,
        stat.no_count || 0,
        stat.na_count || 0,
        stat.total_responses || 0
      ]);
      
      doc.autoTable({
        head: [['Area', 'Activity/Feature', 'Yes', 'No', 'N/A', 'Total']],
        body: statsData,
        startY: 250,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        }
      });
    }
    
    // Add detailed responses with proper question sequencing
    if (allResponses.length > 0) {
      await this.addDetailedResponses(doc, allResponses);
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  async addDetailedResponses(doc, allResponses) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Detailed User Responses', 20, 30);
    
    // User Summary Table
    doc.setFontSize(12);
    doc.text('User Summary:', 20, 50);
    
    const enhancedResponseData = [];
    
    for (const response of allResponses) {
      const userAnswers = await this.getUserAnswers(response.id);
      
      const answerSummary = {
        total: userAnswers.length,
        yes: userAnswers.filter(a => a.answer === 'Yes').length,
        no: userAnswers.filter(a => a.answer === 'No').length,
        na: userAnswers.filter(a => a.answer === 'N/A').length,
        withRemarks: userAnswers.filter(a => a.remarks && a.remarks.trim().length > 0).length
      };
      
      const performanceScore = answerSummary.total > 0 ? Math.round((answerSummary.yes / answerSummary.total) * 100) : 0;
      const completionRate = Math.round((answerSummary.total / 19) * 100);
      
      enhancedResponseData.push([
        response.email,
        response.language === 'EN' ? 'English' : 'Bahasa Indonesia',
        moment(response.timestamp).format('YYYY-MM-DD'),
        `${performanceScore}%`,
        `${answerSummary.yes}/${answerSummary.no}/${answerSummary.na}`,
        answerSummary.withRemarks.toString()
      ]);
    }
    
    doc.autoTable({
      head: [['Email', 'Language', 'Date', 'Score', 'Yes/No/NA', 'Remarks']],
      body: enhancedResponseData,
      startY: 60,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 }, // Email
        1: { cellWidth: 25 }, // Language
        2: { cellWidth: 25 }, // Date
        3: { cellWidth: 20 }, // Score
        4: { cellWidth: 35 }, // Yes/No/NA
        5: { cellWidth: 20 }  // Remarks
      }
    });

    // Add detailed question-answer breakdown for each user
    for (let i = 0; i < allResponses.length; i++) {
      const response = allResponses[i];
      
      // Add new page for each user's detailed answers
      if (i > 0 || doc.autoTable.previous.finalY > 180) {
        doc.addPage();
      }
      
      const startY = i === 0 && doc.autoTable.previous.finalY <= 180 ? doc.autoTable.previous.finalY + 20 : 30;
      
      doc.setFontSize(14);
      doc.text(`${response.email} - Detailed Assessment`, 20, startY);
      
      doc.setFontSize(10);
      doc.text(`Language: ${response.language === 'EN' ? 'English' : 'Bahasa Indonesia'}`, 20, startY + 15);
      doc.text(`Date: ${moment(response.timestamp).format('YYYY-MM-DD HH:mm')}`, 20, startY + 25);
      
      // Get all questions and answers for this user in proper sequence
      const userAnswers = await this.getUserAnswersWithQuestions(response.id, response.language);
      
      if (userAnswers.length > 0) {
        const questionAnswerData = userAnswers.map((qa, index) => [
          (index + 1).toString(),
          qa.area || '',
          qa.activity || '',
          qa.answer || '',
          qa.remarks || ''
        ]);
        
        doc.autoTable({
          head: [['#', 'Area', 'Activity/Feature', 'Answer', 'Remarks']],
          body: questionAnswerData,
          startY: startY + 35,
          theme: 'striped',
          headStyles: { fillColor: [76, 175, 80], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 10 },  // #
            1: { cellWidth: 35 },  // Area
            2: { cellWidth: 60 },  // Activity
            3: { cellWidth: 20 },  // Answer
            4: { cellWidth: 60 }   // Remarks
          }
        });
      }
    }
  }

  async getUserAnswersWithQuestions(responseId, language) {
    try {
      // Get questions in proper sequence with user's answers
      const questionsWithAnswers = await db.query(`
        SELECT 
          q.sequence_order,
          q.area,
          q.activity,
          q.criteria,
          COALESCE(a.answer, 'Not Answered') as answer,
          COALESCE(a.remarks, '') as remarks
        FROM questions q
        LEFT JOIN answers a ON q.id = a.question_id AND a.response_id = ?
        WHERE q.language = ?
        ORDER BY q.sequence_order ASC
      `, [responseId, language]);
      
      return questionsWithAnswers || [];
    } catch (error) {
      console.error('Error fetching questions with answers:', error);
      return [];
    }
  }

  generateQuestionReport(questionId, answers, questionDetails) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Question Analysis Report', 20, 30);
    
    // Question details
    doc.setFontSize(12);
    if (questionDetails) {
      doc.text(`Area: ${questionDetails.area}`, 20, 50);
      doc.text(`Activity: ${questionDetails.activity}`, 20, 65);
      doc.text(`Criteria: ${questionDetails.criteria}`, 20, 80);
    }
    
    // Statistics
    const yesCount = answers.filter(a => a.answer === 'Yes').length;
    const noCount = answers.filter(a => a.answer === 'No').length;
    const naCount = answers.filter(a => a.answer === 'N/A').length;
    const total = answers.length;
    
    doc.text(`Total Responses: ${total}`, 20, 100);
    doc.text(`Yes: ${yesCount} (${total ? Math.round(yesCount/total*100) : 0}%)`, 20, 115);
    doc.text(`No: ${noCount} (${total ? Math.round(noCount/total*100) : 0}%)`, 20, 130);
    doc.text(`N/A: ${naCount} (${total ? Math.round(naCount/total*100) : 0}%)`, 20, 145);
    
    // Remarks table
    const remarksData = answers
      .filter(a => a.remarks && a.remarks.trim())
      .map(answer => [
        answer.answer || '',
        answer.remarks || ''
      ]);
    
    if (remarksData.length > 0) {
      doc.autoTable({
        head: [['Answer', 'Remarks']],
        body: remarksData,
        startY: 165,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 150 }
        }
      });
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}

module.exports = new PDFGenerator();