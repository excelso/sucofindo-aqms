<div class="form-group-control !mt-0">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        <option value="">...</option>
        @if($options != null)
            @foreach($options as $item)
                @php($select = $item->id == $selected ? 'selected' : '')
                <option value="{{ $item->id }}" data-additional="{{ \Carbon\Carbon::parse($item->working_hour_start)->format('H:i') }} - {{ \Carbon\Carbon::parse($item->working_hour_until)->format('H:i') }}" {{ $select }}>
                    {{ $item->shift_name }}
                </option>
            @endforeach
        @endif
    </select>
</div>
