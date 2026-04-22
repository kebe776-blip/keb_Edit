import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.grade.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.teacherAssignment.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.classe.deleteMany()
  await prisma.schoolYear.deleteMany()
  await prisma.student.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.school.deleteMany()

  // Create schools
  const school1 = await prisma.school.create({
    data: {
      name: 'École Primaire La Lumière',
      address: '12 Rue des Écoles, Dakar',
      phone: '+221 33 800 0000',
      email: 'contact@lalumiere.sn',
      description: 'École primaire publique offrant un enseignement de qualité depuis 1995.',
    },
  })

  const school2 = await prisma.school.create({
    data: {
      name: 'Collège Les Savants',
      address: '45 Avenue de la République, Dakar',
      phone: '+221 33 800 1111',
      email: 'info@lessavants.sn',
      description: 'Collège privé d\'excellence avec des programmes bilingues.',
    },
  })

  console.log('✅ Établissements créés')

  // Create school years
  const year1 = await prisma.schoolYear.create({
    data: {
      schoolId: school1.id,
      label: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  })

  const year2 = await prisma.schoolYear.create({
    data: {
      schoolId: school1.id,
      label: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: false,
      isArchived: true,
    },
  })

  const year3 = await prisma.schoolYear.create({
    data: {
      schoolId: school2.id,
      label: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isActive: true,
    },
  })

  console.log('✅ Années scolaires créées')

  // Create subjects for school 1
  const math = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Mathématiques', code: 'MATH', coefficient: 4 },
  })
  const francais = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Français', code: 'FRA', coefficient: 4 },
  })
  const sciences = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Sciences', code: 'SCI', coefficient: 3 },
  })
  const histoire = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Histoire-Géographie', code: 'HGG', coefficient: 2 },
  })
  const anglais = await prisma.subject.create({
    data: { schoolId: school1.id, name: 'Anglais', code: 'ANG', coefficient: 2 },
  })

  console.log('✅ Matières créées')

  // Create classes
  const classA = await prisma.classe.create({
    data: {
      schoolId: school1.id,
      name: '6ème A',
      level: '6ème',
      capacity: 35,
      room: 'Salle 101',
      schoolYearId: year1.id,
    },
  })

  const classB = await prisma.classe.create({
    data: {
      schoolId: school1.id,
      name: '5ème B',
      level: '5ème',
      capacity: 30,
      room: 'Salle 205',
      schoolYearId: year1.id,
    },
  })

  console.log('✅ Classes créées')

  // Create students
  const studentData = [
    { firstName: 'Amadou', lastName: 'Diop', gender: 'M', parentName: 'Moussa Diop' },
    { firstName: 'Fatou', lastName: 'Ndiaye', gender: 'F', parentName: 'Ibrahima Ndiaye' },
    { firstName: 'Ibrahima', lastName: 'Fall', gender: 'M', parentName: 'Ousmane Fall' },
    { firstName: 'Aissatou', lastName: 'Sow', gender: 'F', parentName: 'Abdoulaye Sow' },
    { firstName: 'Mamadou', lastName: 'Ba', gender: 'M', parentName: 'Cheikh Ba' },
    { firstName: 'Mariama', lastName: 'Diallo', gender: 'F', parentName: 'Boubacar Diallo' },
    { firstName: 'Ousmane', lastName: 'Sy', gender: 'M', parentName: 'Moussa Sy' },
    { firstName: 'Khady', lastName: 'Mbaye', gender: 'F', parentName: 'Serge Mbaye' },
    { firstName: 'Abdoulaye', lastName: 'Kane', gender: 'M', parentName: 'Modou Kane' },
    { firstName: 'Awa', lastName: 'Gueye', gender: 'F', parentName: 'Pape Gueye' },
  ]

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.student.create({
        data: {
          schoolId: school1.id,
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          dateOfBirth: new Date('2010-01-15'),
          parentName: s.parentName,
          parentPhone: '+221 77 000 0000',
        },
      })
    )
  )

  console.log('✅ Élèves créés')

  // Create teachers
  const teachers = await Promise.all([
    prisma.teacher.create({
      data: {
        schoolId: school1.id,
        firstName: 'Moussa',
        lastName: 'Traoré',
        subject: 'Mathématiques',
        phone: '+221 76 100 0000',
        email: 'm.traore@lalumiere.sn',
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school1.id,
        firstName: 'Aminata',
        lastName: 'Dieng',
        subject: 'Français',
        phone: '+221 76 200 0000',
        email: 'a.dieng@lalumiere.sn',
      },
    }),
    prisma.teacher.create({
      data: {
        schoolId: school1.id,
        firstName: 'Cheikh',
        lastName: 'Niang',
        subject: 'Sciences',
        phone: '+221 76 300 0000',
        email: 'c.niang@lalumiere.sn',
      },
    }),
  ])

  console.log('✅ Enseignants créés')

  // Enroll students in classes
  for (let i = 0; i < 6; i++) {
    await prisma.enrollment.create({
      data: {
        studentId: students[i].id,
        classId: classA.id,
        schoolYearId: year1.id,
      },
    })
  }
  for (let i = 6; i < 10; i++) {
    await prisma.enrollment.create({
      data: {
        studentId: students[i].id,
        classId: classB.id,
        schoolYearId: year1.id,
      },
    })
  }

  console.log('✅ Inscriptions créées')

  // Create teacher assignments
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teachers[0].id,
      classId: classA.id,
      subjectId: math.id,
      schoolYearId: year1.id,
    },
  })
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teachers[0].id,
      classId: classB.id,
      subjectId: math.id,
      schoolYearId: year1.id,
    },
  })
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teachers[1].id,
      classId: classA.id,
      subjectId: francais.id,
      schoolYearId: year1.id,
    },
  })
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teachers[2].id,
      classId: classA.id,
      subjectId: sciences.id,
      schoolYearId: year1.id,
    },
  })

  console.log('✅ Affectations créées')

  // Create some grades
  const examTypes = ['devoir', 'examen', 'controle']
  for (let i = 0; i < 6; i++) {
    for (let t = 1; t <= 2; t++) {
      await prisma.grade.create({
        data: {
          studentId: students[i].id,
          subjectId: math.id,
          schoolYearId: year1.id,
          classId: classA.id,
          trimester: t,
          examType: examTypes[t - 1],
          score: Math.floor(Math.random() * 10) + 8,
          maxScore: 20,
        },
      })
      await prisma.grade.create({
        data: {
          studentId: students[i].id,
          subjectId: francais.id,
          schoolYearId: year1.id,
          classId: classA.id,
          trimester: t,
          examType: examTypes[t - 1],
          score: Math.floor(Math.random() * 10) + 7,
          maxScore: 20,
        },
      })
    }
  }

  console.log('✅ Notes créées')

  // Create some payments
  for (let i = 0; i < 10; i++) {
    await prisma.payment.create({
      data: {
        studentId: students[i].id,
        schoolYearId: year1.id,
        schoolId: school1.id,
        amount: i < 6 ? 50000 : 45000,
        paymentType: 'inscription',
        method: i % 2 === 0 ? 'especes' : 'cheque',
        reference: `REF-${String(i + 1).padStart(4, '0')}`,
        date: new Date(`2025-09-${String(i + 1).padStart(2, '0')}`),
      },
    })
  }

  // Some scolarité payments
  for (let i = 0; i < 5; i++) {
    await prisma.payment.create({
      data: {
        studentId: students[i].id,
        schoolYearId: year1.id,
        schoolId: school1.id,
        amount: 75000,
        paymentType: 'scolarite',
        method: 'especes',
        reference: `SCOL-${String(i + 1).padStart(4, '0')}`,
        date: new Date(`2025-10-${String(i + 10).padStart(2, '0')}`),
      },
    })
  }

  console.log('✅ Paiements créés')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
