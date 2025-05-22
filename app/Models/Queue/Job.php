<?php

namespace App\Models\Queue;

use ReflectionClass;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $table = 't_jobs';
    protected $guarded = ['id'];


    public function scopeGetJobByPayloadJobId($query, $payloadJobId) {
        $jobs = $query->get(); // Ambil semua data dulu
    
        return $jobs->filter(function ($job) use ($payloadJobId) {
            $payload = json_decode($job->payload, true);
    
            if (isset($payload['data']['command'])) {
                $command = @unserialize($payload['data']['command']);
    
                if ($command) {
                    $reflection = new ReflectionClass($command);
    
                    if ($reflection->hasProperty('jobId')) {
                        $property = $reflection->getProperty('jobId');
                        $property->setAccessible(true);
    
                        return $property->getValue($command) === $payloadJobId;
                    }
                }
            }
    
            return false;
        });
    }

}