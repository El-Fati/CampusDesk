const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: [true, 'Student ID is required.'], trim: true, uppercase: true, unique: true, maxlength: 30 },
  firstName: { type: String, required: [true, 'First name is required.'], trim: true, maxlength: 80 },
  lastName: { type: String, required: [true, 'Last name is required.'], trim: true, maxlength: 80 },
  email: { type: String, required: [true, 'Email is required.'], trim: true, lowercase: true, unique: true },
  phone: { type: String, trim: true, default: '' },
  course: { type: String, required: [true, 'Course is required.'], trim: true, maxlength: 120 },
  department: { type: String, required: [true, 'Department is required.'], trim: true, maxlength: 120 },
  year: { type: String, enum: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate'], default: 'Year 1' },
  status: { type: String, enum: ['active', 'graduated', 'on leave'], default: 'active' },
  gpa: { type: Number, min: 0, max: 5, default: 0 },
  enrollmentDate: { type: Date, default: Date.now },
  notes: { type: String, trim: true, default: '', maxlength: 2000 }
}, { timestamps: true });

studentSchema.virtual('fullName').get(function() { return `${this.firstName} ${this.lastName}`; });
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });
module.exports = mongoose.model('Student', studentSchema);