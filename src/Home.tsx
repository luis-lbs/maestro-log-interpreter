import { ModeToggle } from './components/mode-toggle';
import { Input } from './components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import dayjs from 'dayjs';
import { Progress } from './components/ui/progress';
import {
  CheckCircle,
  CheckSquare,
  Circle,
  Hourglass,
  Square,
  XCircle,
  XSquare,
} from 'lucide-react';

interface dataProcessed {
  duration: string;
  steps: {
    action: string;
    status: 'COMPLETED' | 'FAILED';
    duration: number;
    isFlow: boolean;
    flowStatus: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  }[];
}

export default function Home() {
  const [open, setOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [data, setData] = useState<dataProcessed | null>(null);
  const statusMap = {
    COMPLETED: <CheckSquare color="#34d399" width={15} height={15} />,
    FAILED: <XSquare color="#ef4444" width={15} height={15} />,
  };
  const flowStatusMap = {
    COMPLETED: <CheckCircle color="#34d399" width={22} height={22} />,
    FAILED: <XCircle color="#ef4444" width={24} height={24} />,
    SKIPPED: <Circle color="#a1a1aa" width={21} height={21} />,
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      const selectedFile = files[0];
      const extension = selectedFile.name.slice(-5);
      if (extension !== '.json') {
        setDialogTitle('Erro');
        setDialogDescription(
          'Arquivo inválido! selecione um arquivo .json gerado pelo maestro'
        );
        setOpen(true);
      } else {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target!.result as string);
            const sortedData = jsonData.sort(
              (a: any, b: any) => a.metadata.timestamp - b.metadata.timestamp
            );
            //console.log(jsonData)
            let preProcessedData: dataProcessed = { duration: '', steps: [] };
            let hasError: boolean = false;
            for (let i = 0; i < sortedData.length; i++) {
              setProgress((i / sortedData.length) * 100);
              const currentKey = Object.keys(sortedData[i].command)[0];
              const diffMisc1 = currentKey !== 'defineVariablesCommand';
              const diffMisc2 = currentKey !== 'applyConfigurationCommand';
              if (diffMisc1 && diffMisc2) {
                let action = currentKey;
                let status = sortedData[i].metadata.status;
                let flowStatus = sortedData[i].metadata.status;
                let isFlow = false;
                if (status === 'FAILED') hasError = true;
                if (currentKey === 'runFlowCommand') {
                  action = `${currentKey} ${sortedData[i].command[currentKey].sourceDescription}`;
                  status = null;
                  flowStatus = sortedData[i].metadata.status;
                  isFlow = true;
                }

                preProcessedData.steps.push({
                  action,
                  duration: sortedData[i].metadata.duration / 1000,
                  status,
                  flowStatus,
                  isFlow,
                });
              }
            }

            const startTime = dayjs(sortedData[0].metadata.timestamp);
            if (hasError) {
              preProcessedData.duration = 'FAILED';
            } else {
              const endTime = dayjs(
                sortedData[sortedData.length - 1].metadata.timestamp
              );
              const diff = endTime.diff(startTime);
              preProcessedData.duration = String(diff / 1000 / 60);
            }

            setData(preProcessedData);
            setProgress(100);
          } catch (error) {
            if (error instanceof Error) {
              setDialogTitle('Erro');
              setDialogDescription(error.message);
              setOpen(true);
            }
          }
        };

        fileReader.readAsText(selectedFile);
      }
    }
  };

  return (
    <>
      <main className="flex flex-col px-4 py-4">
        <header className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 w-full">
            <ModeToggle />
            <Input type="file" accept=".json" onChange={handleFileChange} />
          </div>
          <Progress value={progress} className="h-1" />
        </header>
        <div className="flex flex-col w-full pt-4 items-center space-y-4">
          {data !== null && (
            <>
              <div className="w-8/12 flex flex-row gap-2">
                <Hourglass
                  color={data.duration === 'FAILED' ? '#ef4444' : '#34d399'}
                />
                {data.duration === 'FAILED' && 'PROCESS FAILED'}
                {data.duration !== 'FAILED' &&
                  `DONE IN ${parseFloat(data.duration).toFixed(2)} MINUTES`}
              </div>
              {data.steps.map((step) => (
                <>
                  {step.isFlow === false && (
                    <div className="w-8/12 flex flex-row gap-2 text-sm">
                      {statusMap[step.status]}
                      {step.action}
                      {step.status === 'FAILED' && ' have failed'}
                      {step.status === 'COMPLETED' &&
                        ` done in ${step.duration} seconds`}
                    </div>
                  )}
                  {step.isFlow === true && (
                    <div className="w-8/12 flex flex-row gap-2 text-base">
                      {flowStatusMap[step.flowStatus]}
                      {step.action}
                      {step.flowStatus === 'FAILED' && ' have failed'}
                      {step.flowStatus === 'COMPLETED' &&
                        ` done in ${step.duration} seconds`}
                      {step.flowStatus === 'SKIPPED' &&
                        ` have been skipped`}
                    </div>
                  )}
                </>
              ))}
            </>
          )}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
