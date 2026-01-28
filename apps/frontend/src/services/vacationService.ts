import { CreateVacationDto, VacationResponseDto, VacationType } from '../../../../shared/create-vacation.dto';

export const createVacation = async (request: CreateVacationDto): Promise<VacationResponseDto> => {
    // This function would typically make an HTTP request to the backend API.
    const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: VacationResponseDto = await response.json();
    return data;
}
// Usage in React Component
const submitVacation = async () => {
  const vacation: CreateVacationDto = {
    employeeId: '123',
    startDate: '2026-01-25',
    endDate: '2026-01-30',
    type: VacationType.PAID,
  };

  const savedVacation = await createVacation(vacation);
  console.log(savedVacation.status); // PENDING
};
